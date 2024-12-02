import { Server, Socket } from 'socket.io'
import { prisma } from './index'

export const handleSocketConnection = (socket: Socket) => {
  console.log('New client connected')

  socket.on('join-chat', async (chatId: string) => {
    socket.join(chatId)
    console.log(`Client joined chat: ${chatId}`)
  })

  socket.on('leave-chat', (chatId: string) => {
    socket.leave(chatId)
    console.log(`Client left chat: ${chatId}`)
  })

  socket.on('send-message', async (data: { chatId: string, content: string, senderId: number }) => {
    try {
      const message = await prisma.message.create({
        data: {
          content: data.content,
          chatId: parseInt(data.chatId),
          senderId: data.senderId,
        },
      })
      socket.to(data.chatId).emit('new-message', message)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  })

  socket.on('share-document', (data: { chatId: string, documentUrl: string, senderId: number }) => {
    socket.to(data.chatId).emit('document-shared', data)
  })

  // WebRTC signaling
  socket.on('offer', (data: { target: string, caller: string, sdp: RTCSessionDescriptionInit }) => {
    socket.to(data.target).emit('offer', { caller: data.caller, sdp: data.sdp })
  })

  socket.on('answer', (data: { target: string, caller: string, sdp: RTCSessionDescriptionInit }) => {
    socket.to(data.target).emit('answer', { caller: data.caller, sdp: data.sdp })
  })

  socket.on('ice-candidate', (data: { target: string, candidate: RTCIceCandidateInit }) => {
    socket.to(data.target).emit('ice-candidate', data.candidate)
  })

  // Screen sharing
  socket.on('start-screen-share', (data: { roomId: string, stream: MediaStream }) => {
    socket.to(data.roomId).emit('screen-share-started', data.stream)
  })

  socket.on('stop-screen-share', (data: { roomId: string }) => {
    socket.to(data.roomId).emit('screen-share-stopped')
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected')
  })
}

