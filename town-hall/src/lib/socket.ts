import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const initSocket = async () => {
  if (!socket) {
    await fetch('/api/socket')
    socket = io()
  }
  return socket
}

export const getSocket = () => socket 