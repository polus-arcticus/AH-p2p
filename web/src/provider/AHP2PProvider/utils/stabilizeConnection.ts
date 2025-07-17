import { TOPICS } from "./topics"

export const stabilizeConnection = async (
  helia
) => {
  return new Promise<void>(
    (resolve) => {
      let pingInterval: NodeJS.Timeout | null = null
      helia.libp2p.services.pubsub.subscribe(TOPICS.PONG)
      const pongListener = (evt: { detail: { topic: string, data: Uint8Array } }) => {
        const { topic, data } = evt.detail
        if (topic === TOPICS.PONG) {
          console.log('Received pong - connection is stable')
          // Clear the ping interval
          if (pingInterval) {
            clearInterval(pingInterval)
            pingInterval = null
          }
          // Remove this pong listener
          helia.libp2p.services.pubsub.removeEventListener('message', pongListener)
          resolve()
        }
      }
      // Subscribe to pong messages
      helia.libp2p.services.pubsub.addEventListener('message', pongListener)

      // Start sending pings
      pingInterval = setInterval(() => {
        console.log('Sending ping')
        helia.libp2p.services.pubsub.publish(TOPICS.PING, new Uint8Array())
      }, 1000)

    }
  )
}


