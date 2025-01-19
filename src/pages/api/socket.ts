import { Server } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Socket as NetSocket } from 'net'

interface SocketServer extends HTTPServer {
  io?: Server | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
    res.end()
    return
  }

  const io = new Server(res.socket.server)
  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('slideChange', (data) => {
      // Broadcast slide change to all clients
      socket.broadcast.emit('slideChange', data)
    })

    socket.on('response', (data) => {
      // Broadcast response to all clients
      io.emit('response', data)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  console.log('Setting up socket')
  res.end()
}

export default SocketHandler 