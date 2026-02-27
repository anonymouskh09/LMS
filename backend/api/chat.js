const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, isChatUser } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);
router.use(isChatUser);

// Chat allowed for: admin, principal, teacher, student, bd_agent. NOT super_admin.

// List users that current user can chat with (exclude self and super_admin)
router.get('/users', async (req, res) => {
  try {
    const myId = req.user.id;
    const [users] = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id != ? AND role != 'super_admin'
       ORDER BY name ASC`,
      [myId]
    );
    res.json({ success: true, users });
  } catch (err) {
    console.error('Chat users error:', err);
    res.status(500).json({ success: false, message: 'Failed to load chat users' });
  }
});

// Conversations list with last message + unread count, ordered like modern messengers
router.get('/conversations', async (req, res) => {
  try {
    const myId = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        lm.message AS last_message,
        lm.created_at AS last_message_at,
        (
          SELECT COUNT(*) 
          FROM chat_messages um 
          WHERE um.sender_id = u.id 
            AND um.receiver_id = ? 
            AND um.read_at IS NULL
        ) AS unread_count
      FROM users u
      LEFT JOIN chat_messages lm 
        ON (
          (lm.sender_id = u.id AND lm.receiver_id = ?) OR
          (lm.sender_id = ? AND lm.receiver_id = u.id)
        )
        AND lm.created_at = (
          SELECT MAX(created_at)
          FROM chat_messages
          WHERE 
            (sender_id = u.id AND receiver_id = ?) OR
            (sender_id = ? AND receiver_id = u.id)
        )
      WHERE 
        u.id != ?
        AND u.role != 'super_admin'
      ORDER BY 
        COALESCE(lm.created_at, '1970-01-01') DESC,
        u.name ASC
      `,
      [myId, myId, myId, myId, myId, myId]
    );

    res.json({
      success: true,
      conversations: rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        last_message: row.last_message || '',
        last_message_at: row.last_message_at,
        unread_count: Number(row.unread_count || 0)
      }))
    });
  } catch (err) {
    console.error('Chat conversations error:', err);
    res.status(500).json({ success: false, message: 'Failed to load conversations' });
  }
});

// Get messages between current user and otherUserId
router.get('/messages/:otherUserId', async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = parseInt(req.params.otherUserId, 10);
    if (!otherId) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }
    const [rows] = await pool.query(
      `SELECT id, sender_id, receiver_id, message, created_at, read_at
       FROM chat_messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`,
      [myId, otherId, otherId, myId]
    );
    res.json({ success: true, messages: rows });
  } catch (err) {
    console.error('Chat messages error:', err);
    res.status(500).json({ success: false, message: 'Failed to load messages' });
  }
});

// Mark messages as read when opening a conversation
router.post('/read/:otherUserId', async (req, res) => {
  try {
    const myId = req.user.id;
    const otherId = parseInt(req.params.otherUserId, 10);
    if (!otherId) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    await pool.query(
      `UPDATE chat_messages 
       SET read_at = NOW() 
       WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL`,
      [otherId, myId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Chat mark read error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
  }
});

// Send message (store in DB and emit via socket in server.js using app.get('io'))
router.post('/messages', async (req, res) => {
  try {
    const myId = req.user.id;
    const { receiver_id, message } = req.body;
    if (!receiver_id || !message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'receiver_id and message required' });
    }
    const receiverId = parseInt(receiver_id, 10);
    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Invalid receiver id' });
    }
    // Ensure receiver is not super_admin
    const [[receiver]] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [receiverId]
    );
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (receiver.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Cannot send message to this user' });
    }

    const [result] = await pool.query(
      'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [myId, receiverId, message.trim()]
    );
    const insertId = result.insertId;
    const [[row]] = await pool.query(
      'SELECT id, sender_id, receiver_id, message, created_at, read_at FROM chat_messages WHERE id = ?',
      [insertId]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('chat:message', {
        id: row.id,
        sender_id: row.sender_id,
        receiver_id: row.receiver_id,
        message: row.message,
        created_at: row.created_at,
        read_at: row.read_at
      });
    }

    res.status(201).json({ success: true, message: row });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

module.exports = router;
