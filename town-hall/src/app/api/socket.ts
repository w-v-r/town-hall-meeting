import { Server as SocketIOServer } from 'socket.io'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Server as HTTPServer } from 'http'
import type { Socket as NetSocket } from 'net'

interface SocketServer extends HTTPServer {
  io?: SocketIOServer | undefined
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

  console.log('Setting up socket')
  const io = new SocketIOServer(res.socket.server)
  res.socket.server.io = io

  // Track participants by presentation
  const presentationParticipants = new Map<string, Set<string>>()

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('joinPresentation', (data) => {
      const { presentationId, participantName } = data
      socket.join(presentationId)
      
      // Add participant to tracking
      if (!presentationParticipants.has(presentationId)) {
        presentationParticipants.set(presentationId, new Set())
      }
      presentationParticipants.get(presentationId)?.add(participantName)
      
      // Notify everyone in the presentation
      io.to(presentationId).emit('participantJoined', { name: participantName })
      
      console.log(`${participantName} joined presentation ${presentationId}`)
    })

    socket.on('slideChange', (data) => {
      const { presentationId, slideIndex, slide } = data
      socket.to(presentationId).emit('slideChange', { slideIndex, slide })
    })

    socket.on('response', (data) => {
      const { presentationId } = data
      io.to(presentationId).emit('response', data)
    })

    socket.on('disconnect', () => {
      // Clean up participant tracking
      presentationParticipants.forEach((participants, presentationId) => {
        participants.forEach(name => {
          io.to(presentationId).emit('participantLeft', { name })
        })
      })
      console.log('Client disconnected:', socket.id)
    })
  })

  res.end()
}

export default SocketHandler 