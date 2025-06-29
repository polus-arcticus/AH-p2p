import { useContext, useEffect } from 'react'
import { HeliaContext } from '../providers/HeliaProvider'

export const useAuctionRoom = (roomId: string | undefined) => {
    const { 
        peerId,
        chatMessages, 
        sendChatMessage, 
        currentRoom, 
        joinRoom, 
        leaveRoom, 
        roomPeers,
        starting,
        error
    } = useContext(HeliaContext)

    // Auto-join room when component mounts
    useEffect(() => {
        if (roomId && roomId !== currentRoom && !starting && !error) {
            joinRoom(roomId)
        }
    }, [roomId, currentRoom, joinRoom, starting, error])

    return {
        peerId,
        chatMessages,
        sendChatMessage,
        currentRoom,
        leaveRoom,
        roomPeers,
        starting,
        error
    }
} 