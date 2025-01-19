import { useEffect, useState } from 'react'

interface WebSocketMessage {
  action: string
  data: any
}

export function useWebSocket(presentationId: string) {
  const [connectionId, setConnectionId] = useState<string | null>(null)
  
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT!)
    
    ws.onopen = () => {
      // Connect and store connection ID
      ws.send(JSON.stringify({
        action: 'connect',
        presentationId
      }))
    }

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      if (message.action === 'connected') {
        setConnectionId(message.data.connectionId)
      }
      // Handle other message types
    }

    return () => {
      ws.close()
    }
  }, [presentationId])

  const sendMessage = async (action: string, data: any) => {
    if (!connectionId) return

    await fetch('/api/socket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        connectionId,
        data: {
          action,
          data
        }
      })
    })
  }

  return { sendMessage }
} 