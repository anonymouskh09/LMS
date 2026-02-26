const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool } = require('../config/database');

const router = express.Router();

// Request Password Reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Check if user exists
    const [users] = await pool.query(
      'SELECT id, name, email FROM users WHERE email = ?',
      [email]
    );

    // Always return success message (don't reveal if email exists - security best practice)
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    }

    const user = users[0];

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiration time (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing unused tokens for this user
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = ? AND used = FALSE',
      [user.id]
    );

    // Store token in database
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    // Generate reset link
    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    // For now, just log to console (in production, send email)
    console.log('\n📧 ========== PASSWORD RESET EMAIL ==========');
    console.log(`To: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`\nPassword Reset Link:`);
    console.log(resetLink);
    console.log(`\nThis link will expire in 1 hour.`);
    console.log('============================================\n');

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
      // In development, also return the link
      resetLink: resetLink
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Verify Reset Token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const [tokens] = await pool.query(
      `SELECT t.*, u.email 
       FROM password_reset_tokens t
       JOIN users u ON t.user_id = u.id
       WHERE t.token = ? AND t.used = FALSE AND t.expires_at > NOW()`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      email: tokens[0].email
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify token is valid and not expired
    const [tokens] = await pool.query(
      `SELECT t.*, u.id as user_id, u.email 
       FROM password_reset_tokens t
       JOIN users u ON t.user_id = u.id
       WHERE t.token = ? AND t.used = FALSE AND t.expires_at > NOW()`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const tokenData = tokens[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, tokenData.user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
      [token]
    );

    console.log(`✅ Password reset successful for user: ${tokenData.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
});

module.exports = router;
