const express = require('express')
const moment = require('moment-timezone')
const isoCountries = require('i18n-iso-countries')
const router = express.Router()

router.get('/timezones', async (req, res) => {
  try {
    let zones = moment.tz.names()
    res.json({ timezones: zones })
  } catch (error) {
    res.status(500).send({ message: 'Internal Error' })
  }
})

router.get('/countries', async (req, res) => {
  try {
    let countries = Object.entries(isoCountries.getNames('en')).reduce(
      (acc, [key, value]) => {
        acc.push({
          code: key,
          name: value,
        })
        return acc
      },
      []
    )
    res.json({ countries })
  } catch (error) {
    res.status(500).send({ message: 'Internal Error' })
  }
})

module.exports = router
