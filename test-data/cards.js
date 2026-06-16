// ข้อมูล user sandbox ของ saucedemo.com
const USERS = {
  standard: {
    username: 'standard_user',
    password: 'secret_sauce'
  },
  locked: {
    username: 'locked_out_user',
    password: 'secret_sauce'
  },
  problem: {
    username: 'problem_user',
    password: 'secret_sauce'
  }
}

// ข้อมูล checkout
const CHECKOUT_INFO = {
  valid: {
    firstName: 'Test',
    lastName : 'User',
    zipCode  : '10000'
  },
  missingFirst: {
    firstName: '',
    lastName : 'User',
    zipCode  : '10000'
  },
  missingLast: {
    firstName: 'Test',
    lastName : '',
    zipCode  : '10000'
  },
  missingZip: {
    firstName: 'Test',
    lastName : 'User',
    zipCode  : ''
  }
}

module.exports = { USERS, CHECKOUT_INFO }