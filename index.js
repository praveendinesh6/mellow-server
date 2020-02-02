'use strict'
const dotenv = require('dotenv')
dotenv.config()
// Dependencies
const { prisma } = require('./generated/prisma-client')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require('cookie-parser')
// Router/Middleware Utils
const createUser = require('./utils/create-user')
const loginUser = require('./utils/login-user')
const authenticateUser = require('./utils/authenticate-user')
const { formatUser, userFragment } = require('./utils/common')
let userRouter = require('./routes/user')
let teamRouter = require('./routes/team')
let metaRouter = require('./routes/meta')
let errorHandler = require('./routes/error')
// HTTP Server
const WSServer = require('ws').Server
const server = require('http').createServer()

// Express JS Handling
const app = express()
app.use(bodyParser.json())
app.use(
  cors({
    origin: [
      `${process.env.CLIENT_URL || ''}`,
      'http://localhost:8080',
      'https://mellow.work',
    ],
    credentials: true,
  })
)
app.use(cookieParser())

// Handlers
app.use('/api', authenticateUser)
app.post('/login', loginUser)
app.post('/signup', createUser)
app.get('/api/account', async (req, res) => {
  let userId = req.userId

  try {
    let user = await prisma.user({ id: userId }).$fragment(userFragment)
    res.json({ user: formatUser(user) })
  } catch (error) {
    res.status(401).send({ message: 'Could not find user' })
  }
})
// Routers
app.use('/api/user', userRouter)
app.use('/api/team', teamRouter)
app.use('/api/meta', metaRouter)

server.on('request', app)

// WS HANDLING
const wss = new WSServer({
  server,
})

// DO NOT MODIFY
server.listen(3000, () =>
  console.log('Server is running on http://localhost:3000')
)
