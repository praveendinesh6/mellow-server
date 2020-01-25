const { prisma } = require('./generated/prisma-client')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')

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

const createUser = async (req, res) => {
  try {
    let data = req.body
    let hashedPassword = await bcrypt.hash(data.password, 10)
    data.password = hashedPassword

    let user = await prisma.createUser({
      ...data,
      profile: {
        create: {
          name: '',
        },
      },
    })
    let userToken = {
      token: jwt.sign({ userId: user.id }, secretword, { expiresIn }),
    }
    res.json(userToken)
  } catch (error) {
    res.status(401).send(error)
  }
}

app.post('/signup', createUser)

app.post('/api/user/create', createUser)

app.get(`/api/users`, async (req, res) => {
  let users = await prisma
    .users()
    .$fragment(`fragment user on User { id, email }`)
  res.json(users)
})

const userProfile = `
fragment userProfile on User {
  id
  email
  profile {
    id
    name
    country
    timezone
    role
    status
  }
}
`

app.get('/api/user/:userId', async (req, res) => {
  let currentUser = req.userId
  let userId = req.params.userId

  try {
    // TODO: Check if userId belongs to current users team
    let user = await prisma.user({ id: userId }).$fragment(userProfile)
    res.json(user)
  } catch (error) {
    res.status(401).send({ message: 'Could not find user' })
  }
})

app.put(`/api/user/:userId/update`, async (req, res) => {
  let userId = req.userId
  try {
    let profile = await prisma.user({ id: userId }).profile()

    let updateUserProfile = await prisma.updateProfile({
      where: { id: profile.id },
      data: req.body,
    })
    res.json(updateUserProfile)
  } catch (err) {
    res.status(401).send(err)
  }
})

app.post(`/api/user/:userId/update-status`, async (req, res) => {
  let currentUser = req.userId
  let userId = req.params.userId
  // TODO Check if user IDs are same
  let { status } = req.body
  try {
    let profile = await prisma.user({ id: userId }).profile()
    let updateUserProfile = await prisma.updateProfile({
      where: { id: profile.id },
      data: { status: status },
    })
    res.json(updateUserProfile)
  } catch (err) {
    res.status(401).send(err)
  }
})

app.post('/api/user/:userId/make-admin', async (req, res) => {
  let currentUser = req.userId
  let userId = req.params.userId

  if (currentUser == userId) {
    res.status(400).send({ message: 'You cannot make youself an Admin' })
  }

  let markAsAdmin = await prisma.upsertProfile({
    where: { id: userId },
    data: { role: 'ADMIN' },
  })

  res.json(markAsAdmin)
})

app.post('/api/team/create', async (req, res) => {
  let currentUser = req.userId
  try {
    let data = req.body

    let users = data.users || [{ id: currentUser }]
    delete data.users

    let team = await prisma.createTeam({ ...data, users: { connect: users } })
    res.json(team)
  } catch (error) {
    res.status(401).send(error)
  }
})

app.put('/api/team/:teamId/update', async (req, res) => {
  let userId = req.userId
  let teamId = req.params.teamId

  try {
    // TODO: Check if userId belongs to team
    let data = req.body
    let users = data.users || [{ id: userId }]
    delete data.users

    let updateTeam = await prisma.updateTeam({
      where: { id: teamId },
      data: { ...data, users: { connect: users } },
    })
    res.json(updateTeam)
  } catch (error) {
    res.status(401).send(error)
  }
})

app.get('/api/team/:teamId', async (req, res) => {
  let userId = req.userId
  let teamId = req.params.teamId

  try {
    // TODO: Check if userId belongs to team
    let team = await prisma.team({ id: teamId })
    res.json(team)
  } catch (error) {
    res.status(401).send({ message: 'Could not find team' })
  }
})

app.get('/api/team/:teamId/users', async (req, res) => {
  let userId = req.userId
  let teamId = req.params.teamId

  try {
    // TODO: Check if userId belongs to team
    let users = await prisma
      .team({ id: teamId })
      .users()
      .$fragment(userProfile)
    res.json(users)
  } catch (error) {
    res.status(401).send({ message: 'Could not find team' })
  }
})

app.post('/api/team/:teamId/join', async (req, res) => {
  let userId = req.userId
  let teamId = req.params.teamId

  try {
    // TODO: Check if userId belongs to team
    let data = req.body
    let users = data.users || [{ id: userId }]

    let updateTeam = await prisma.updateTeam({
      where: { id: teamId },
      data: { users: { connect: users } },
    })
    res.json(updateTeam)
  } catch (error) {
    res.status(401).send(error)
  }
})

app.listen(3000, () =>
  console.log('Server is running on http://localhost:3000')
)
