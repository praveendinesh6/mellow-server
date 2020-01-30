const express = require('express')
const { prisma } = require('../generated/prisma-client')
const { formatUser, userFragment } = require('../utils/common')
const createUser = require('../utils/create-user')

const router = express.Router()

router.post('/create', createUser)

router.get('/:userId', async (req, res) => {
  let currentUser = req.userId
  let userId = req.params.userId

  try {
    // TODO: Check if userId belongs to current users team
    let user = await prisma.user({ id: userId }).$fragment(userFragment)
    res.json(formatUser(user))
  } catch (error) {
    res.status(401).send({ message: 'Could not find user' })
  }
})

router.put(`/:userId/update`, async (req, res) => {
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

router.post(`/:userId/update-status`, async (req, res) => {
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

router.post('/:userId/make-admin', async (req, res) => {
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

module.exports = router
