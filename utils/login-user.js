const { prisma } = require('../generated/prisma-client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const secretword = process.env.SECRET_WORD
const expiresIn = process.env.TOKEN_EXPIRY

module.exports = async (req, res) => {
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
}
