import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatCircle, PaperPlaneTilt, SignOut, UserCircle, ArrowLeft, MagnifyingGlass } from '@phosphor-icons/react'
import { io } from 'socket.io-client'
import './Chat.css'

const API = 'http://localhost:5000/api'
const SOCKET_URL = 'http://localhost:5000'

function Chat() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [chatUsers, setChatUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!userData || !token) {
      navigate('/signin')
      return
    }
    try {
      const u = JSON.parse(userData)
      setUser(u)
      if (u.role === 'super_admin') {
        navigate('/dashboard')
        return
      }
    } catch (e) {
      navigate('/signin')
      return
    }
  }, [navigate])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('token')
    fetch(`${API}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setChatUsers(data.conversations || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user) return
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    const socket = socketRef.current
    socket.emit('chat:join', user.id)
    return () => {
      socket.disconnect()
    }
  }, [user])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    const onMsg = (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id)
        if (exists) return prev
        const withUser = (msg.sender_id === user?.id && msg.receiver_id === selectedUser?.id) ||
          (msg.receiver_id === user?.id && msg.sender_id === selectedUser?.id)
        if (selectedUser && withUser) return [...prev, msg]
        return prev
      })
    }
    socket.on('chat:message', onMsg)
    return () => socket.off('chat:message', onMsg)
  }, [user?.id, selectedUser?.id])

  useEffect(() => {
    if (!user || !selectedUser) return
    const token = localStorage.getItem('token')
    setMessages([])
    fetch(`${API}/chat/messages/${selectedUser.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setMessages(data.messages || [])
      })
    // mark messages as read for this conversation
    fetch(`${API}/chat/read/${selectedUser.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setChatUsers(prev =>
        prev.map(u =>
          u.id === selectedUser.id ? { ...u, unread_count: 0 } : u
        )
      )
    }).catch(() => {})
  }, [user, selectedUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || !selectedUser || !user) return
    setSending(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API}/chat/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiver_id: selectedUser.id, message: text })
      })
      const data = await res.json()
      if (data.success) {
        setMessages((prev) => [...prev, data.message])
        setChatUsers(prev => {
          const updated = prev.map(u =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  last_message: data.message.message,
                  last_message_at: data.message.created_at,
                  // we are the sender, unread count for us stays 0
                }
              : u
          )
          // sort by last_message_at desc
          return [...updated].sort((a, b) => {
            const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
            const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
            return tb - ta
          })
        })
        setNewMessage('')
      } else {
        alert(data.message || 'Failed to send')
      }
    } catch (err) {
      alert('Failed to send message')
    }
    setSending(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    navigate('/signin')
  }

  const handleSelectUser = (u) => {
    setSelectedUser(u)
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return chatUsers
    return chatUsers.filter(u =>
      u.name.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term))
    )
  }, [chatUsers, search])

  if (!user) return null

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-header-left">
          <button type="button" className="chat-back-btn" onClick={() => navigate('/dashboard')} aria-label="Back">
            <ArrowLeft size={22} weight="bold" />
          </button>
          <ChatCircle size={26} weight="duotone" className="chat-logo-icon" />
          <div>
            <h1 className="chat-title">LMS Chat</h1>
            <p className="chat-subtitle">{user.name} · {user.role}</p>
          </div>
        </div>
        <button type="button" className="chat-logout-btn" onClick={handleLogout}>
          <SignOut size={20} /> Sign Out
        </button>
      </header>

      <div className="chat-layout">
        <aside className="chat-sidebar">
          <p className="chat-sidebar-label">Chat with</p>
          <div className="chat-search">
            <MagnifyingGlass size={16} />
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <p className="chat-loading">Loading...</p>
          ) : (
            <ul className="chat-user-list">
              {filteredUsers.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className={`chat-user-btn ${selectedUser?.id === u.id ? 'active' : ''}`}
                    onClick={() => handleSelectUser(u)}
                  >
                    <UserCircle size={24} weight="duotone" />
                    <div className="chat-user-info">
                      <span className="chat-user-name">{u.name}</span>
                      <span className="chat-user-meta">
                        {u.last_message
                          ? `${u.role} · ${u.last_message.slice(0, 32)}${u.last_message.length > 32 ? '…' : ''}`
                          : u.role}
                      </span>
                    </div>
                    {u.unread_count > 0 && (
                      <span className="chat-unread-badge">
                        {u.unread_count > 9 ? '9+' : u.unread_count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && chatUsers.length === 0 && (
            <p className="chat-empty">No users to chat with.</p>
          )}
        </aside>

        <main className="chat-main">
          {!selectedUser ? (
            <div className="chat-placeholder">
              <ChatCircle size={64} weight="duotone" />
              <p>Select a user to start chatting</p>
            </div>
          ) : (
            <>
              <div className="chat-conversation-header">
                <UserCircle size={28} weight="duotone" />
                <div>
                  <strong>{selectedUser.name}</strong>
                  <span>{selectedUser.role}</span>
                </div>
              </div>
              <div className="chat-messages">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-bubble ${m.sender_id === user.id ? 'sent' : 'received'}`}
                  >
                    <span className="chat-bubble-text">{m.message}</span>
                    <span className="chat-bubble-time">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-form" onSubmit={handleSend}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" className="chat-send-btn" disabled={sending || !newMessage.trim()}>
                  <PaperPlaneTilt size={20} weight="fill" />
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default Chat
