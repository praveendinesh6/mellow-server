const dotenv = require('dotenv')
dotenv.config()
// Dependencies
const { prisma } = require('./generated/prisma-client')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const cookieParser = require('cookie-parser')
// Router/Middleware Utils
const createUser = require('./utils/create-user')
const authenticateUser = require('./utils/authenticate-user')
const { formatUser, userFragment } = require('./utils/common')
let userRouter = require('./routes/user')
let teamRouter = require('./routes/team')
let metaRouter = require('./routes/meta')
let errorHandler = require('./routes/error')
// ENV VARIABLES
const secretword = process.env.SECRET_WORD
const expiresIn = process.env.TOKEN_EXPIRY

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

app.use('/api', authenticateUser)

app.post('/login', async (req, res) => {
  try {
    let data = req.body
    let user = await prisma.user({ email: data.email })
    let isValidUser = await bcrypt.compare(data.password, user.password)
    if (isValidUser) {
      let token = jwt.sign({ userId: user.id }, secretword, { expiresIn })

      res.cookie('mellowToken', `Token ${token}`, {
        expires: new Date(Date.now() + expiresIn),
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      })
      res.json({ token })
    } else {
      res.status(401).send({ message: 'Invalid password' })
    }
  } catch {
    res.status(401).send({ message: 'Could not find a user with this email' })
  }
})

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
app.use('/api/user', userRouter)
app.use('/api/team', teamRouter)
app.use('/api/meta', metaRouter)

app.listen(3000, () =>
  console.log('Server is running on http://localhost:3000')
)
