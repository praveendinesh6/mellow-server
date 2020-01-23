const { prisma } = require('./generated/prisma-client')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const secretword = 'pleaseDontHackMe3248'
const expiresIn = '1 day'

const userListFragment = `
fragment userList on User {
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

app.use(bodyParser.json())

app.use((req, res, next) => {
  const { authorization } = req.headers
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
  }
})

const skipAuth = (req, res, next) => {
  req.skipAuth = true
  next()
}

app.post('/login', skipAuth, async (req, res) => {
  try {
    let data = req.body
    let user = await prisma.user({ email: data.email })
    let isValidUser = await bcrypt.compare(data.password, user.password)
    if (isValidUser) {
      let userToken = {
        token: jwt.sign({ userId: user.id }, secretword, { expiresIn }),
      }
      res.json(userToken)
    } else {
      res.status(401).send({ message: 'Invalid password' })
    }
  } catch {
    res.status(401).send({ message: 'Could not find user with the email ' })
  }
})

app.get(`/users`, async (req, res) => {
  let users = await prisma.users().$fragment(userListFragment)
  res.json(users)
})

app.post('/user/create', async (req, res) => {
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
})

app.get('/user/:userId', async (req, res) => {
  let currentUser = req.userId
  let userId = req.params.userId

  try {
    // TODO: Check if userId belongs to current users team
    let user = await prisma.user({ id: userId })
    res.json(user)
  } catch (error) {
    res.status(401).send({ message: 'Could not find user' })
  }
})

// TODO
app.post(`/user/:userId/update-profile`, async (req, res) => {
  let userId = req.userId
  try {
    let updateUserProfile = await prisma.updateProfile({
      where: { id: userId },
      data: req.body,
    })
    res.json(updateUserProfile)
  } catch (err) {
    res.status(401).send(err)
  }
})

app.put('/user/:userId/make-admin', async (req, res) => {
  let currentUser = req.userId
  let userId = req.params.userId

  if (currentUser == userId) {
    res.status(400).send({ message: 'You cannot make youself an Admin' })
  }

  let markAsAdmin = await prisma.upsertProfile({
    where: { id: userId },
    data: { role: 'Admin' },
  })

  res.json(markAsAdmin)
})

app.post('/team/create', async (req, res) => {
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

app.put('/team/:teamId/update', async (req, res) => {
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

app.get('/team/:teamId', async (req, res) => {
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

app.listen(3000, () =>
  console.log('Server is running on http://localhost:3000')
)
