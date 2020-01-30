const formatUser = userObj => {
  let { profile, ...user } = userObj
  return { ...user, ...profile }
}

const userFragment = `
fragment userProfile on User {
  id
  email
  profile {
    name
    country
    timezone
    role
    status
    vacation
    workDays {
      sun
      mon
      tue
      wed
      thu
      fri
      sat
    }
    workStartTime
    workEndTime
    vacationStart
    vacationEnd
  }
}
`

module.exports = { formatUser, userFragment }
