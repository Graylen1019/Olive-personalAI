import { useState } from 'react'

function App() {
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([])

  const handleSend = async () => {
    if (!message) return;

    // 1. Add your message to the screen immediately
    setChatHistory([...chatHistory, { role: 'User', text: message }])

    // 2. Send the message to our Gateway (The Traffic Cop)
    const response = await fetch('http://localhost:3005/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message })
    })

    const data = await response.json()

    // 3. Add the Gateway's reply to the screen
    setChatHistory(prev => [...prev, { role: 'AI', text: data.response }])
    setMessage('') // Clear the input box
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Enterprise AI Chat</h1>
      <div style={{ border: '1px solid #ccc', height: '400px', overflowY: 'scroll', padding: '10px', marginBottom: '10px' }}>
        {chatHistory.map((chat, i) => (
          <p key={i}><strong>{chat.role}:</strong> {chat.text}</p>
        ))}
      </div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Ask something..." 
        style={{ width: '80%', padding: '10px' }}
      />
      <button onClick={handleSend} style={{ padding: '10px', marginLeft: '5px' }}>Send</button>
    </div>
  )
}

export default App