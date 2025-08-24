import React, { useState, useEffect, useRef } from 'react'

interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: number
  type: 'message' | 'bid' | 'system'
  avatar?: string
}

interface AuctionChatProps {
  auctionId?: string
  room?: {
    address?: string
    [key: string]: any
  } | null
  auction?: {
    peers?: Record<string, string>
    [key: string]: any
  } | null
  messages: any[]
  postChatMessage: (message: string) => Promise<void>
}

const AuctionChat: React.FC<AuctionChatProps> = ({ 
  auctionId, 
  room, 
  auction,
  messages,
  postChatMessage
}) => {
  
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>(['GameMaster']) // Always show GameMaster
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Set connected state when room is available
  useEffect(() => {
    setIsConnected(!!room)
  }, [room])

  // Load active warriors from auction peers
  useEffect(() => {
    if (auction?.peers) {
      const peerIds = Object.keys(auction.peers)
      const formattedPeers = peerIds.map(peerId => {
        // Show first 4 and last 4 characters with ... in between
        if (peerId.length > 8) {
          return `${peerId.slice(0, 4)}...${peerId.slice(-4)}`
        }
        return peerId
      })
      setOnlineUsers(['GameMaster', ...formattedPeers])
      console.log('🎯 Active warriors loaded from peers:', formattedPeers)
    } else {
      // Fallback to GameMaster only if no peers
      setOnlineUsers(['GameMaster'])
    }
  }, [auction?.peers])

  // Auto-scroll to bottom when new messages arrive (only within chat container)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !room) return

    try {
      console.log('🎯 Sending battle message:', newMessage.trim())
      await postChatMessage(newMessage.trim())
      
      // Message will be added via parent component's room watcher
      setNewMessage('')
      console.log('⚡ Battle message sent successfully!')
    } catch (error) {
      console.error('❌ Failed to send battle message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getMessageTypeStyles = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300'
      case 'bid':
        return 'bg-green-500/20 border-green-500/30 text-green-300'
      default:
        return 'bg-slate-700/50 border-slate-600'
    }
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'system':
        return '🤖'
      case 'bid':
        return '💰'
      default:
        return '💬'
    }
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden glow-cyan">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">💬</div>
            <div>
              <h3 className="text-xl font-bold text-white">Battle Chat</h3>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-slate-300">
                  {isConnected ? 'Connected to Arena' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Warriors Online</div>
            <div className="text-lg font-bold text-cyan-400">{onlineUsers.length}</div>
          </div>
        </div>
      </div>

      {/* Online Users */}
      <div className="bg-slate-900/30 border-b border-slate-600 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-slate-400">🏆 Active Warriors:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {onlineUsers.map((user, index) => (
            <div
              key={index}
              className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded-lg text-xs text-slate-300 flex items-center gap-1"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              {user}
            </div>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="h-96 overflow-y-auto p-4 space-y-3 bg-slate-900/20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="text-4xl mb-2">🤐</div>
            <div className="text-lg font-semibold mb-1">Arena is Silent</div>
            <div className="text-sm text-center">
              Be the first warrior to break the silence!<br />
              Share your battle strategy or cheer for competitors! 🎮
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${getMessageTypeStyles(message.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-lg">
                  {message.avatar || getMessageIcon(message.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">
                      {message.user}
                    </span>
                    {message.type === 'bid' && (
                      <span className="px-2 py-0.5 bg-green-500/30 text-green-300 text-xs rounded-full border border-green-500/50">
                        BID PLACED
                      </span>
                    )}
                    {message.type === 'system' && (
                      <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded-full border border-blue-500/50">
                        SYSTEM
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="text-slate-200">
                    {message.message}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-slate-600 p-4 bg-slate-800/30">
        <div className="flex gap-3">
          <input
            ref={chatInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Enter your battle cry... ⚔️" : "Connecting to arena..."}
            disabled={!isConnected}
            className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
            maxLength={500}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!isConnected || !newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed glow-cyan"
          >
            <span className="flex items-center gap-2">
              🚀 <span className="hidden sm:inline">Send</span>
            </span>
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>💡 Tip: Use emojis to express your battle spirit!</span>
          </div>
          <div>
            {newMessage.length}/500
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuctionChat
