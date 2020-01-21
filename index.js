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

var validateToken = async (req, res) => {
  try {
    var header = req.headers.authorization

    if (header) {
      var token = header.replace('Token ', '')
      var decodedToken = jwt.verify(token, secretword)
      if (decodedToken.userId) {
        var user = await prisma.user({ id: decodedToken.userId })
        return user
      }
    }
  } catch {
    res.status(401).send({ message: 'Token expired. Login again to proceed' })
  }
}

app.use(bodyParser.json())

app.post('/user/create', async (req, res) => {
  var data = req.body
  var hashedPassword = await bcrypt.hash(data.password, 10)
  data.password = hashedPassword
  var user = await prisma.createUser(data)
  var userToken = {
    token: jwt.sign({ userId: user.id }, secretword, { expiresIn }),
  }
  res.json(userToken)
})

app.post('/login', async (req, res) => {
  try {
    var data = req.body
    var user = await prisma.user({ email: data.email })
    var isValidUser = await bcrypt.compare(data.password, user.password)
    if (isValidUser) {
      var userToken = {
        token: jwt.sign({ userId: user.id }, secretword, { expiresIn }),
      }
      res.json(userToken)
    } else {
      res.status(401).send({ message: 'Invalid password.' })
    }
  } catch {
    res.status(401).send({ message: 'Could not find user with the email ' })
  }
})

app.get(`/users`, async (req, res) => {
  await validateToken(req, res)
  var users = await prisma.users().$fragment(userListFragment)
  res.json(users)
})

// TODO
app.post(`/user/:userId/update-profile`, async (req, res) => {
  var requestedUser = validateToken(req, res)
  var userId = req.params.userId
  try {
    var updateUserProfile = await prisma.updateProfile({
      where: { id: userId },
      data: req.body,
    })
    res.json(updateUserProfile)
  } catch (err) {
    res.status(401).send(err)
  }
})

app.put('/user/:userId/make-admin', async (req, res) => {
  var requestedUser = validateToken(req, res)
  var userId = req.params.userId
  if (requestedUser.id == userId) {
    res.status(400).send({ message: 'You cannot make youself an Admin' })
  }
  var markAsAdmin = await prisma.upsertProfile({
    where: { id: userId },
    data: { role: 'Admin' },
  })
  res.json(markAsAdmin)
})

app.listen(3000, () =>
  console.log('Server is running on http://localhost:3000')
)
