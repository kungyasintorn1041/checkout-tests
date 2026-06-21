import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────
// Banking System — Test Suite
// ครอบคลุม: Login, โอนเงิน, สมัครสินเชื่อ, API Testing
// Base URL ตั้งใน playwright.config.ts
// ─────────────────────────────────────────────────────────────────

const BASE_API = 'https://bank-staging.example.com/api'

// ── TEST DATA ────────────────────────────────────────────────────
const USERS = {
  valid:  { username: 'test_user',   password: 'Pass@1234' },
  wrong:  { username: 'test_user',   password: 'WrongPass' },
  locked: { username: 'locked_user', password: 'Pass@1234' },
}

const TRANSFER = {
  validAccount:  '1234567890',
  selfAccount:   '0000000001',
  validAmount:   '1000',
  overBalance:   '9999999',
  overLimit:     '500001',
  zeroAmount:    '0',
  validOTP:      '123456',
  wrongOTP:      '000000',
}

const LOAN = {
  valid:     { firstName: 'สมชาย', lastName: 'ใจดี', phone: '0812345678', income: '50000', amount: '500000', tenure: '60' },
  lowIncome: { firstName: 'สมชาย', lastName: 'ใจดี', phone: '0812345678', income: '5000',  amount: '500000', tenure: '60' },
}

// ─────────────────────────────────────────────────────────────────
// SCN-001: LOGIN & AUTHENTICATION
// ─────────────────────────────────────────────────────────────────

test.describe('SCN-001: Login & Authentication', () => {

  // TC-001: Positive — login สำเร็จ
  test('TC-001: Login ด้วย valid credentials → redirect dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Username').fill(USERS.valid.username)
    await page.getByLabel('Password').fill(USERS.valid.password)
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByTestId('user-greeting')).toBeVisible()
  })

  // TC-002: Negative — password ผิด
  test('TC-002: Login ด้วย password ผิด → error message', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Username').fill(USERS.wrong.username)
    await page.getByLabel('Password').fill(USERS.wrong.password)
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByTestId('error-message')).toBeVisible()
    await expect(page.getByTestId('error-message')).toContainText('รหัสผ่านไม่ถูกต้อง')
    await expect(page).toHaveURL(/login/)
  })

  // TC-003: Negative — ไม่กรอก username
  test('TC-003: Login ไม่กรอก username → validation error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Password').fill(USERS.valid.password)
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByTestId('error-message')).toContainText('กรุณากรอก username')
  })

  // TC-004: Edge Case — login ผิด 3 ครั้ง → account locked
  test('TC-004: Login ผิด 3 ครั้ง → account locked', async ({ page }) => {
    await page.goto('/login')

    for (let i = 0; i < 3; i++) {
      await page.getByLabel('Username').fill(USERS.valid.username)
      await page.getByLabel('Password').fill('WrongPass')
      await page.getByRole('button', { name: 'Login' }).click()
    }

    await expect(page.getByTestId('error-message')).toContainText('บัญชีถูกระงับชั่วคราว')
    await expect(page.getByRole('button', { name: 'Login' })).toBeDisabled()
  })

})

// ─────────────────────────────────────────────────────────────────
// SCN-002: FUND TRANSFER (โอนเงิน)
// ─────────────────────────────────────────────────────────────────

test.describe('SCN-002: Fund Transfer', () => {

  // inject session เพื่อข้าม login — เร็วกว่า
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{
      name:   'session_token',
      value:  process.env.TEST_SESSION_TOKEN || 'test-token-sandbox',
      domain: 'bank-staging.example.com',
      path:   '/',
    }])
    await page.goto('/transfer')
  })

  // TC-005: Positive — โอนเงินสำเร็จ
  test('TC-005: โอนเงินครบทุก step → สำเร็จ', async ({ page }) => {
    await page.getByLabel('เลขบัญชีปลายทาง').fill(TRANSFER.validAccount)
    await page.getByLabel('จำนวนเงิน').fill(TRANSFER.validAmount)
    await page.getByRole('button', { name: 'ถัดไป' }).click()

    // ตรวจ summary ก่อนยืนยัน
    await expect(page.getByTestId('confirm-amount')).toContainText('1,000')
    await expect(page.getByTestId('confirm-account')).toContainText(TRANSFER.validAccount)
    await page.getByRole('button', { name: 'ยืนยัน' }).click()

    // กรอก OTP
    await expect(page.getByTestId('otp-modal')).toBeVisible()
    await page.getByLabel('รหัส OTP').fill(TRANSFER.validOTP)
    await page.getByRole('button', { name: 'ยืนยัน OTP' }).click()

    // ตรวจ success
    await expect(page.getByTestId('transfer-success')).toBeVisible()
    await expect(page.getByTestId('ref-number')).toHaveText(/^REF\d{10}$/)
  })

  // TC-006: Negative — โอนเกินยอด
  test('TC-006: โอนเงินเกินยอดในบัญชี → error', async ({ page }) => {
    await page.getByLabel('เลขบัญชีปลายทาง').fill(TRANSFER.validAccount)
    await page.getByLabel('จำนวนเงิน').fill(TRANSFER.overBalance)
    await page.getByRole('button', { name: 'ถัดไป' }).click()

    await expect(page.getByTestId('error-message')).toContainText('ยอดเงินไม่เพียงพอ')
  })

  // TC-007: Negative — โอนเกินวงเงินต่อวัน
  test('TC-007: โอนเงินเกินวงเงินต่อวัน → error', async ({ page }) => {
    await page.getByLabel('เลขบัญชีปลายทาง').fill(TRANSFER.validAccount)
    await page.getByLabel('จำนวนเงิน').fill(TRANSFER.overLimit)
    await page.getByRole('button', { name: 'ถัดไป' }).click()

    await expect(page.getByTestId('error-message')).toContainText('เกินวงเงินโอนต่อวัน')
  })

  // TC-008: Negative — OTP ผิด
  test('TC-008: กรอก OTP ผิด → error ยังอยู่หน้าเดิม', async ({ page }) => {
    await page.getByLabel('เลขบัญชีปลายทาง').fill(TRANSFER.validAccount)
    await page.getByLabel('จำนวนเงิน').fill(TRANSFER.validAmount)
    await page.getByRole('button', { name: 'ถัดไป' }).click()
    await page.getByRole('button', { name: 'ยืนยัน' }).click()

    await page.getByLabel('รหัส OTP').fill(TRANSFER.wrongOTP)
    await page.getByRole('button', { name: 'ยืนยัน OTP' }).click()

    await expect(page.getByTestId('otp-error')).toContainText('OTP ไม่ถูกต้อง')
    await expect(page.getByTestId('otp-modal')).toBeVisible()
  })

  // TC-009: Edge Case — โอน 0 บาท
  test('TC-009: โอนเงิน 0 บาท → validation error', async ({ page }) => {
    await page.getByLabel('เลขบัญชีปลายทาง').fill(TRANSFER.validAccount)
    await page.getByLabel('จำนวนเงิน').fill(TRANSFER.zeroAmount)
    await page.getByRole('button', { name: 'ถัดไป' }).click()

    await expect(page.getByTestId('error-message')).toContainText('กรุณากรอกจำนวนเงิน')
  })

  // TC-010: Edge Case — โอนหาตัวเอง
  test('TC-010: โอนเงินหาตัวเอง → error', async ({ page }) => {
    await page.getByLabel('เลขบัญชีปลายทาง').fill(TRANSFER.selfAccount)
    await page.getByLabel('จำนวนเงิน').fill(TRANSFER.validAmount)
    await page.getByRole('button', { name: 'ถัดไป' }).click()

    await expect(page.getByTestId('error-message')).toContainText('ไม่สามารถโอนหาตัวเองได้')
  })

})

// ─────────────────────────────────────────────────────────────────
// SCN-003: LOAN APPLICATION (สมัครสินเชื่อ)
// ─────────────────────────────────────────────────────────────────

test.describe('SCN-003: Loan Application', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{
      name:   'session_token',
      value:  process.env.TEST_SESSION_TOKEN || 'test-token-sandbox',
      domain: 'bank-staging.example.com',
      path:   '/',
    }])
    await page.goto('/loan/apply')
  })

  // TC-011: Positive — สมัครสินเชื่อสำเร็จครบ flow
  test('TC-011: สมัครสินเชื่อครบ 3 step → สำเร็จ', async ({ page }) => {
    const { firstName, lastName, phone, income, amount, tenure } = LOAN.valid

    // Step 1: ข้อมูลส่วนตัว
    await page.getByLabel('ชื่อ').fill(firstName)
    await page.getByLabel('นามสกุล').fill(lastName)
    await page.getByLabel('เบอร์โทร').fill(phone)
    await page.getByRole('button', { name: 'ถัดไป' }).click()

    // Step 2: ข้อมูลการเงิน
    await page.getByLabel('รายได้ต่อเดือน').fill(income)
    await page.getByLabel('วงเงินที่ต้องการ').fill(amount)
    await page.getByRole('combobox', { name: 'ระยะเวลา' }).selectOption(tenure)
    await page.getByRole('button', { name: 'คำนวณ' }).click()

    // ตรวจผลคำนวณ
    await expect(page.getByTestId('monthly-payment')).not.toBeEmpty()
    await page.getByRole('button', { name: 'ถัดไป' }).click()

    // Step 3: แนบเอกสาร
    await page.getByLabel('สลิปเงินเดือน').setInputFiles('./fixtures/salary-slip.pdf')
    await expect(page.getByText('salary-slip.pdf')).toBeVisible()
    await page.getByRole('button', { name: 'ส่งใบสมัคร' }).click()

    // ตรวจผลสุดท้าย
    await expect(page.getByTestId('application-success')).toBeVisible()
    await expect(page.getByTestId('application-number')).toHaveText(/^LOAN-\d{8}$/)
  })

  // TC-012: Negative — รายได้ต่ำกว่าเกณฑ์
  test('TC-012: รายได้ต่ำกว่าเกณฑ์ → ปุ่ม ถัดไป disabled', async ({ page }) => {
    await page.goto('/loan/apply?step=2')
    await page.getByLabel('รายได้ต่อเดือน').fill(LOAN.lowIncome.income)
    await page.getByLabel('วงเงินที่ต้องการ').fill(LOAN.lowIncome.amount)
    await page.getByRole('button', { name: 'คำนวณ' }).click()

    await expect(page.getByTestId('income-warning')).toContainText('รายได้ขั้นต่ำ 15,000 บาท')
    await expect(page.getByRole('button', { name: 'ถัดไป' })).toBeDisabled()
  })

  // TC-013: Negative — แนบไฟล์ผิดประเภท
  test('TC-013: แนบไฟล์ผิดประเภท → error', async ({ page }) => {
    await page.goto('/loan/apply?step=3')
    await page.getByLabel('สลิปเงินเดือน').setInputFiles('./fixtures/test.exe')

    await expect(page.getByTestId('file-error')).toContainText('รองรับเฉพาะ PDF/JPG')
  })

})

// ─────────────────────────────────────────────────────────────────
// SCN-005 & 006: API TESTING
// ─────────────────────────────────────────────────────────────────

test.describe('API: Authentication Endpoints', () => {

  // TC-014: API login สำเร็จ
  test('TC-014: POST /auth/login → 200 + token', async ({ request }) => {
    const response = await request.post(`${BASE_API}/auth/login`, {
      data: { username: USERS.valid.username, password: USERS.valid.password }
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.token).toBeDefined()
    expect(body.token.length).toBeGreaterThan(10)
    expect(body.expiresIn).toBeDefined()
  })

  // TC-015: API login password ผิด
  test('TC-015: POST /auth/login password ผิด → 401', async ({ request }) => {
    const response = await request.post(`${BASE_API}/auth/login`, {
      data: { username: USERS.wrong.username, password: USERS.wrong.password }
    })

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.message).toContain('Invalid credentials')
  })

})

test.describe('API: Transfer Endpoints', () => {

  let token: string

  // login ครั้งเดียวแล้วแชร์ token
  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BASE_API}/auth/login`, {
      data: { username: USERS.valid.username, password: USERS.valid.password }
    })
    const body = await response.json()
    token = body.token
  })

  // TC-016: API โอนเงินสำเร็จ
  test('TC-016: POST /transfer → 200 + refNo', async ({ request }) => {
    const response = await request.post(`${BASE_API}/transfer`, {
      headers: { Authorization: `Bearer ${token}` },
      data:    { toAccount: TRANSFER.validAccount, amount: 1000, note: 'test transfer' }
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.refNo).toMatch(/^REF\d+$/)
    expect(body.remainingBalance).toBeGreaterThanOrEqual(0)
  })

  // TC-017: API ไม่มี token → 401
  test('TC-017: POST /transfer ไม่มี token → 401', async ({ request }) => {
    const response = await request.post(`${BASE_API}/transfer`, {
      data: { toAccount: TRANSFER.validAccount, amount: 1000 }
    })

    expect(response.status()).toBe(401)
  })

  // TC-018: ตรวจยอดหลังโอน — E2E API + UI
  test('TC-018: GET /balance → ยอดถูกต้องหลังโอน', async ({ request }) => {
    // ดูยอดก่อนโอน
    const before = await request.get(`${BASE_API}/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const { balance: balanceBefore } = await before.json()

    // โอนเงิน 1,000
    await request.post(`${BASE_API}/transfer`, {
      headers: { Authorization: `Bearer ${token}` },
      data:    { toAccount: TRANSFER.validAccount, amount: 1000 }
    })

    // ดูยอดหลังโอน
    const after = await request.get(`${BASE_API}/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const { balance: balanceAfter } = await after.json()

    // ตรวจว่ายอดลดลง 1,000 จริงๆ
    expect(balanceAfter).toBe(balanceBefore - 1000)
  })

})
