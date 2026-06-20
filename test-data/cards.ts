// ── Interfaces (โครงสร้างข้อมูล) ────────────────────────────────────────

export interface User {
  username: string
  password: string
}

export interface CheckoutInfo {
  firstName: string
  lastName:  string
  zipCode:   string
}

// ── ข้อมูล user sandbox ของ saucedemo.com ───────────────────────────────

export const USERS: Record<string, User> = {
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

// ── ข้อมูล checkout ──────────────────────────────────────────────────────

export const CHECKOUT_INFO: Record<string, CheckoutInfo> = {
  valid: {
    firstName: 'Test',
    lastName:  'User',
    zipCode:   '10000'
  },
  missingFirst: {
    firstName: '',
    lastName:  'User',
    zipCode:   '10000'
  },
  missingLast: {
    firstName: 'Test',
    lastName:  '',
    zipCode:   '10000'
  },
  missingZip: {
    firstName: 'Test',
    lastName:  'User',
    zipCode:   ''
  }
}
