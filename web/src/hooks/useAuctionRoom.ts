import { useContext, useEffect, useState } from 'react'
import { HeliaContext } from '../providers/HeliaProvider'
import type { ChatMessage } from '../services/pubsub'

export const useAuctionRoom = (roomId: string | undefined) => {
    const { starting, error, AHP2P } = useContext(HeliaContext)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [currentRoom, setCurrentRoom] = useState<string | null>(null)
    const [roomPeers, setRoomPeers] = useState<string[]>([])

    // Load chat messages for the room
    const loadChatMessages = async () => {
        if (!roomId || !AHP2P?.pubsubService) return
        
        try {
            const messages = await AHP2P.pubsubService.getChatMessages(roomId)
            setChatMessages(messages)
        } catch (error) {
            console.error('Failed to load chat messages:', error)
        }
    }

    // Send chat message
    const sendChatMessage = async (message: string) => {
        if (!roomId || !AHP2P?.pubsubService) return false
        
        try {
            const success = await AHP2P.pubsubService.sendChatMessage(message, roomId)
            if (success) {
                // Reload messages to include the new one
                await loadChatMessages()
            }
            return success
        } catch (error) {
            console.error('Failed to send chat message:', error)
            return false
        }
    }

    // Join room
    const joinRoom = (roomId: string) => {
        if (!AHP2P?.pubsubService) return
        
        AHP2P.pubsubService.joinRoom(roomId)
        setCurrentRoom(roomId)
        loadChatMessages()
    }

    // Leave room
    const leaveRoom = () => {
        if (!currentRoom || !AHP2P?.pubsubService) return
        
        AHP2P.pubsubService.leaveRoom(currentRoom)
        setCurrentRoom(null)
        setChatMessages([])
    }

    // Auto-join room when component mounts
    useEffect(() => {
        if (roomId && roomId !== currentRoom && !starting && !error && AHP2P?.pubsubService) {
            joinRoom(roomId)
        }
    }, [roomId, currentRoom, starting, error, AHP2P])

    // Auto-refresh chat messages periodically
    useEffect(() => {
        if (!currentRoom || !AHP2P?.pubsubService) return
        
        const interval = setInterval(loadChatMessages, 5000) // Refresh every 5 seconds
        return () => clearInterval(interval)
    }, [currentRoom, AHP2P])

    return {
        peerId: AHP2P?.helia?.libp2p?.peerId?.toString(),
        chatMessages,
        sendChatMessage,
        currentRoom,
        leaveRoom,
        roomPeers,
        starting,
        error
    }
} 