const express = require('express')
const moment = require('moment-timezone')

const router = express.Router()

router.get('/timezones', async (req, res) => {
  try {
    let zones = moment.tz.names()
    res.json({ timezones: zones })
  } catch (error) {
    res.status(500).send({ message: 'Internal Error' })
  }
})

module.exports = router
