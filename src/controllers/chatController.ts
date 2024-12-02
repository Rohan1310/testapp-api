import { Request, Response } from 'express'
import { prisma } from '../index'
import { z } from 'zod'
import crypto from 'crypto'

const algorithm = 'aes-256-cbc'
const key = crypto.randomBytes(32)
const iv = crypto.randomBytes(16)

function encrypt(text: string) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') }
}

function decrypt(text: { iv: string, encryptedData: string }) {
  let iv = Buffer.from(text.iv, 'hex')
  let encryptedText = Buffer.from(text.encryptedData, 'hex')
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = z.object({ chatId: z.string() }).parse(req.params)
    const messages = await prisma.message.findMany({
      where: { chatId: parseInt(chatId) },
      orderBy: { createdAt: 'asc' },
    })
    const decryptedMessages = messages.map(msg => ({
      ...msg,
      content: decrypt(JSON.parse(msg.content))
    }))
    res.json(decryptedMessages)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.errors })
    } else {
      res.status(500).json({ message: 'Error fetching messages', error })
    }
  }
}

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId } = z.object({ chatId: z.string() }).parse(req.params)
    const { content } = z.object({ content: z.string() }).parse(req.body)
    const userId = (req as any).userId

    const encryptedContent = encrypt(content)
    const message = await prisma.message.create({
      data: {
        content: JSON.stringify(encryptedContent),
        chatId: parseInt(chatId),
        senderId: userId,
      },
    })
    res.status(201).json(message)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.errors })
    } else {
      res.status(500).json({ message: 'Error sending message', error })
    }
  }
}

export const createGroupChat = async (req: Request, res: Response) => {
  try {
    const { name, userIds } = z.object({
      name: z.string(),
      userIds: z.array(z.number())
    }).parse(req.body)
    const userId = (req as any).userId

    const groupChat = await prisma.groupChat.create({
      data: {
        name,
        users: {
          connect: [{ id: userId }, ...userIds.map(id => ({ id }))]
        }
      },
      include: { users: true }
    })
    res.status(201).json(groupChat)
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.errors })
    } else {
      res.status(500).json({ message: 'Error creating group chat', error })
    }
  }
}

