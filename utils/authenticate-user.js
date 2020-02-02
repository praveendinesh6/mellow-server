const secretword = process.env.SECRET_WORD
const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
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
}
