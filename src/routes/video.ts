import express from 'express'
import { initiateVideoCall, answerCall, endVideoCall } from '../controllers/videoController'

const router = express.Router()

router.post('/initiate', initiateVideoCall)
router.post('/answer', answerCall)
router.post('/end', endVideoCall)

export default router

