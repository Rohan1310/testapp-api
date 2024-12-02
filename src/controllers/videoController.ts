import { Request, Response } from 'express'
import { Server as SocketServer } from 'socket.io'
import { z } from 'zod'

let io: SocketServer

export const setSocketServer = (socketServer: SocketServer) => {
  io = socketServer
}

export const initiateVideoCall = (req: Request, res: Response) => {
  try {
    const { targetIds } = z.object({
      targetIds: z.array(z.string())
    }).parse(req.body)
    const callerId = (req as any).userId

    if (!io) {
      return res.status(500).json({ message: 'Socket server not initialized' })
    }

    // Emit an event to all target users to notify them of an incoming call
    targetIds.forEach(targetId => {
      io.to(targetId).emit('incoming-call', { callerId, targetIds })
    })

    res.json({ message: 'Video call initiated', callerId, targetIds })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.errors })
    } else {
      res.status(500).json({ message: 'Error initiating video call', error })
    }
  }
}

export const answerCall = (req: Request, res: Response) => {
  try {
    const { callerId, answer } = z.object({
      callerId: z.string(),
      answer: z.any()
    }).parse(req.body)
    const targetId = (req as any).userId

    if (!io) {
      return res.status(500).json({ message: 'Socket server not initialized' })
    }

    // Emit an event to the caller with the answer
    io.to(callerId).emit('call-answered', { targetId, answer })

    res.json({ message: 'Call answered', callerId, targetId })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.errors })
    } else {
      res.status(500).json({ message: 'Error answering call', error })
    }
  }
}

export const endVideoCall = (req: Request, res: Response) => {
  try {
    const { targetIds } = z.object({
      targetIds: z.array(z.string())
    }).parse(req.body)
    const callerId = (req as any).userId

    if (!io) {
      return res.status(500).json({ message: 'Socket server not initialized' })
    }

    // Emit an event to all users to end the call
    [...targetIds, callerId].forEach(id => {
      io.to(id).emit('call-ended', { callerId, targetIds })
    })

    res.json({ message: 'Video call ended', callerId, targetIds })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.errors })
    } else {
      res.status(500).json({ message: 'Error ending video call', error })
    }
  }
}

