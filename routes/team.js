const express = require('express')
const { prisma } = require('../generated/prisma-client')
const { formatUser, userFragment } = require('../utils/common')

const router = express.Router()

router.post('/create', async (req, res) => {
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

router.put('/:teamId/update', async (req, res) => {
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

router.get('/:teamId', async (req, res) => {
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

router.get('/:teamId/users', async (req, res) => {
  let userId = req.userId
  let teamId = req.params.teamId

  try {
    // TODO: Check if userId belongs to team
    let users = await prisma
      .team({ id: teamId })
      .users()
      .$fragment(userFragment)

    res.json(users.map(formatUser))
  } catch (error) {
    res.status(401).send({ message: 'Could not find team' })
  }
})

router.post('/:teamId/join', async (req, res) => {
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

module.exports = router
