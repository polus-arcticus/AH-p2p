import './App.css'
import { useContext, useEffect, useState } from 'react'
import { HeliaContext } from './providers/HeliaProvider'

function App() {
  const { peerList, peerId, chatMessages, sendChatMessage } = useContext(HeliaContext)
  const [messageInput, setMessageInput] = useState('')

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendChatMessage(messageInput)
      setMessageInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>P2P Chat</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Your Peer ID:</h3>
        <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{peerId}</code>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Connected Peers ({Object.keys(peerList).length}):</h3>
        {Object.keys(peerList).map((peerId) => (
          <div key={peerId} style={{ fontSize: '12px', marginBottom: '5px' }}>
            <code>{peerId}</code>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'auto', padding: '10px', marginBottom: '10px', backgroundColor: '#f9f9f9' }}>
        <h3>Chat Messages:</h3>
        {chatMessages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: '10px', padding: '5px', backgroundColor: msg.peerId === peerId ? '#e3f2fd' : '#fff', borderRadius: '5px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {msg.peerId === peerId ? 'You' : `Peer: ${msg.peerId.slice(-8)}`} - {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
            <div>{msg.message}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
          disabled={Object.keys(peerList).length === 0}
        />
        <button 
          onClick={handleSendMessage}
          disabled={Object.keys(peerList).length === 0 || !messageInput.trim()}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Send
        </button>
      </div>
      
      {Object.keys(peerList).length === 0 && (
        <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
          Waiting for peers to connect...
        </p>
      )}
    </div>
  )
}

export default App
