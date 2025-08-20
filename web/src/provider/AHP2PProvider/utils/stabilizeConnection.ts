import { TOPICS } from "./topics"
import type { CustomHelia, PubSubMessageEvent } from "../../../types/orbitdb"

export const stabilizeConnection = async (
  helia: CustomHelia
): Promise<Record<string, string>> => {
  return new Promise<Record<string, string>>(
    (resolve) => {
      let pingInterval: NodeJS.Timeout | null = null
      helia.libp2p.services.pubsub.subscribe(TOPICS.PONG)
      const pongListener = (evt: PubSubMessageEvent) => {
        const { topic, data } = evt.detail
        
        // Only process messages on the PONG topic
        if (topic === TOPICS.PONG) {
          console.log('pong listener triggered - received pong message')
          console.log('Received pong - connection is stable')
          const dataJson = JSON.parse(new TextDecoder().decode(data))
          console.log('dataJson', dataJson)
          
          // Clear the ping interval
          if (pingInterval) {
            clearInterval(pingInterval)
            pingInterval = null
          }
          // Remove this pong listener
          helia.libp2p.services.pubsub.removeEventListener('message', pongListener)
          resolve(dataJson)
        }
        // Ignore messages on other topics
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


