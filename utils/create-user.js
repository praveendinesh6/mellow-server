const { prisma } = require('../generated/prisma-client')
const bcrypt = require('bcryptjs')

module.exports = createUser = async (req, res) => {
  try {
    let data = req.body
    let hashedPassword = await bcrypt.hash(data.password, 10)
    data.password = hashedPassword

    let user = await prisma
      .createUser({
        ...data,
        profile: {
          create: {
            name: '',
            workDays: {
              create: {},
            },
          },
        },
      })
      .$fragment(`fragment user on User { id, email }`)
    res.json(user)
  } catch (error) {
    res.status(401).send(error)
  }
}
