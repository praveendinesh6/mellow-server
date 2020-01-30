const { prisma } = require('./generated/prisma-client')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')

// Utils
const createUser = require('./utils/create-user')

// Routers
let userRouter = require('./routes/user')
let teamRouter = require('./routes/team')
let metaRouter = require('./routes/meta')
let errorHandler = require('./routes/error')

dotenv.config()

const secretword = 'pleaseDontHackMe3248'
const expiresIn = '1d'

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

app.use('/api', (req, res, next) => {
  let authorization = req.cookies.mellowToken || ''
  if (!authorization) authorization = req.headers.authorization

  if (authorization) {
    let token = authorization.replace('Token ', '')
    jwt.verify(token, secretword, (err, decodedToken) => {
      if (err || !decodedToken) {
        res
          .status(401)
          .send({ message: 'Token expired. Login again to proceed' })
        return
      }
      req.userId = decodedToken.userId
      next()
    })
  } else {
    res.status(401).send({ message: 'Invalid credentials' })
  }
})

app.post('/login', async (req, res) => {
  try {
    let data = req.body
    let user = await prisma.user({ email: data.email })
    let isValidUser = await bcrypt.compare(data.password, user.password)
    if (isValidUser) {
      let token = jwt.sign({ userId: user.id }, secretword, { expiresIn })

      res.cookie('mellowToken', `Token ${token}`, {
        expires: new Date(Date.now() + expiresIn),
        secure: false, // set to true if your using https
        httpOnly: true,
      })
      res.json({ token })
    } else {
      res.status(401).send({ message: 'Invalid password' })
    }
  } catch {
    res.status(401).send({ message: 'Could not find user with the email ' })
  }
})

app.post('/signup', createUser)

app.use('/api/user', userRouter)
app.use('/api/team', teamRouter)
app.use('/api/meta', metaRouter)

app.listen(3000, () =>
  console.log('Server is running on http://localhost:3000')
)
