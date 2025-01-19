import { Server as SocketIOServer } from 'socket.io'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const socketHandler = (req: NextRequest) => {
  if (process.env.NODE_ENV !== 'production') {
    // For development, use the local Socket.IO server
    return NextResponse.json({ status: 'ok' })
  } else {
    // For production, use the AWS WebSocket API
    return NextResponse.json({ 
      endpoint: process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT 
    })
  }
}

export { socketHandler as GET, socketHandler as POST } 