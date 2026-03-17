import { useState } from 'react'

interface ChatMessage {
  role: 'User' | 'AI' | 'System';
  text: string;
}

function App() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return;

    // 1. Add User message
    const newUserMsg = { role: 'User' as const, text: message };
    setChatHistory(prev => [...prev, newUserMsg]);
    setMessage('');
    setIsTyping(true);

    try {
      // 2. Gateway Handshake
      const response = await fetch('http://localhost:3005/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      });

      const data = await response.json();

      // 3. Add AI reply
      setChatHistory(prev => [...prev, { role: 'AI', text: data.response }]);
    } catch (error) {
      if (error instanceof Error) {
        setChatHistory(prev => [...prev, { role: 'System', text: "Connection to Gateway failed." }]);
      }
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <h1 style={{ marginBottom: '20px', letterSpacing: '-1px' }}>Knowledge Assistant</h1>

      {/* Chat Window */}
      <div style={{
        width: '100%',
        maxWidth: '700px',
        height: '500px',
        backgroundColor: '#262626',
        borderRadius: '12px',
        border: '1px solid #333',
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {chatHistory.map((chat, i) => (
          <div key={i} style={{
            alignSelf: chat.role === 'User' ? 'flex-end' : 'flex-start',
            maxWidth: '80%'
          }}>
            <div style={{
              fontSize: '0.75rem',
              marginBottom: '4px',
              textAlign: chat.role === 'User' ? 'right' : 'left',
              color: '#888'
            }}>
              {chat.role}
            </div>
            <div style={{
              backgroundColor: chat.role === 'User' ? '#3b82f6' : '#333',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '14px',
              borderBottomRightRadius: chat.role === 'User' ? '2px' : '14px',
              borderBottomLeftRadius: chat.role === 'AI' ? '2px' : '14px',
              lineHeight: '1.5'
            }}>
              {chat.text}
            </div>
          </div>
        ))}
        {isTyping && <div style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>AI is thinking...</div>}
      </div>

      {/* Input Area */}
      <div style={{ width: '100%', maxWidth: '700px', marginTop: '20px', display: 'flex', gap: '10px' }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid #444',
            backgroundColor: '#262626',
            color: 'white',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: '0 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default App