import express from 'express'
import http from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth'
import chatRoutes from './routes/chat'
import videoRoutes from './routes/video'
import { handleSocketConnection } from './socket'
import { setSocketServer } from './controllers/videoController'

const app = express()
const server = http.createServer(app)
const io = new SocketServer(server, {
  cors: {
    origin: '*', // In production, specify your frontend URL
    methods: ['GET', 'POST']
  }
})

export const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/video', videoRoutes)

setSocketServer(io)

io.on('connection', handleSocketConnection)

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

