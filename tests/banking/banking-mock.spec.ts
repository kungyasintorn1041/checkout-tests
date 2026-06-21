import { test, expect } from '@playwright/test'
import { setupBankingMocks } from '../../fixtures/bankingMocks'

const BASE = 'https://www.saucedemo.com'
const AUTH = 'Bearer mock-token-xyz-999'

async function fetchViaPage(page: any, url: string, options: any = {}) {
  return page.evaluate(
    async ({ url, options }: { url: string; options: any }) => {
      const res = await fetch(url, {
        method:  options.method  || 'GET',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        body:    options.body ? JSON.stringify(options.body) : undefined,
      })
      const text = await res.text()
      let json: any = null
      try { json = JSON.parse(text) } catch {}
      return { status: res.status, json }
    },
    { url, options }
  )
}

// ── Login API ─────────────────────────────────────────────────────

test.describe('Mock: Login API', () => {

  test.beforeEach(async ({ page }) => {
    await setupBankingMocks(page)
    await page.goto(BASE)
  })

  test('TC-M01: login ถูก → 200 และได้ token กลับมา', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/auth/login`, {
      method: 'POST',
      body:   { username: 'test_user', password: 'Pass@1234' }
    })
    expect(res.status).toBe(200)
    expect(res.json.token).toBe('mock-token-xyz-999')
    expect(res.json.userId).toBe('U001')
    expect(res.json.expiresIn).toBe(3600)
  })

  test('TC-M02: login password ผิด → 401 Unauthorized', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/auth/login`, {
      method: 'POST',
      body:   { username: 'test_user', password: 'WrongPassword' }
    })
    expect(res.status).toBe(401)
    expect(res.json.message).toBe('Invalid credentials')
  })

  test('TC-M03: locked account → 403 Forbidden', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/auth/login`, {
      method: 'POST',
      body:   { username: 'locked_user', password: 'Pass@1234' }
    })
    expect(res.status).toBe(403)
    expect(res.json.message).toBe('บัญชีถูกระงับชั่วคราว')
  })

})

// ── Balance API ───────────────────────────────────────────────────

test.describe('Mock: Balance API', () => {

  test.beforeEach(async ({ page }) => {
    await setupBankingMocks(page)
    await page.goto(BASE)
  })

  test('TC-M04: GET balance พร้อม token → 200 และยอดถูกต้อง', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/balance`, {
      headers: { Authorization: AUTH }
    })
    expect(res.status).toBe(200)
    expect(res.json.balance).toBe(50000)
    expect(res.json.currency).toBe('THB')
    expect(res.json.accountName).toBe('สมชาย ใจดี')
  })

  test('TC-M05: GET balance ไม่มี token → 401', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/balance`)
    expect(res.status).toBe(401)
  })

})

// ── Transfer API ──────────────────────────────────────────────────

test.describe('Mock: Transfer API', () => {

  test.beforeEach(async ({ page }) => {
    await setupBankingMocks(page)
    await page.goto(BASE)
  })

  test('TC-M06: โอนเงิน 1,000 บาท → success และได้ refNo', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/transfer`, {
      method:  'POST',
      headers: { Authorization: AUTH },
      body:    { toAccount: '1234567890', amount: 1000 }
    })
    expect(res.status).toBe(200)
    expect(res.json.success).toBe(true)
    expect(res.json.refNo).toMatch(/^REF\d+$/)
    expect(res.json.remainingBalance).toBe(49000)
  })

  test('TC-M07: โอนเงิน 31,000 บาท → เกินวงเงินต่อวัน', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/transfer`, {
      method:  'POST',
      headers: { Authorization: AUTH },
      body:    { toAccount: '1234567890', amount: 31000 }
    })
    expect(res.status).toBe(400)
    expect(res.json.error).toBe('เกินวงเงินต่อวัน')
  })

  test('TC-M08: โอนเงิน 60,000 บาท → ยอดเงินไม่เพียงพอ', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/transfer`, {
      method:  'POST',
      headers: { Authorization: AUTH },
      body:    { toAccount: '1234567890', amount: 60000 }
    })
    expect(res.status).toBe(400)
    expect(res.json.error).toBe('ยอดเงินไม่เพียงพอ')
  })

  test('TC-M09: โอนเงิน 0 บาท → validation error', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/transfer`, {
      method:  'POST',
      headers: { Authorization: AUTH },
      body:    { toAccount: '1234567890', amount: 0 }
    })
    expect(res.status).toBe(400)
    expect(res.json.error).toBe('กรุณากรอกจำนวนเงิน')
  })

  test('TC-M10: โอนหาตัวเอง → ไม่สามารถโอนได้', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/transfer`, {
      method:  'POST',
      headers: { Authorization: AUTH },
      body:    { toAccount: '0000000001', amount: 1000 }
    })
    expect(res.status).toBe(400)
    expect(res.json.error).toBe('ไม่สามารถโอนหาตัวเองได้')
  })

  test('TC-M11: โอนเงินโดยไม่มี token → 401', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/transfer`, {
      method: 'POST',
      body:   { toAccount: '1234567890', amount: 1000 }
    })
    expect(res.status).toBe(401)
  })

})

// ── OTP Verification ──────────────────────────────────────────────

test.describe('Mock: OTP Verification', () => {

  test.beforeEach(async ({ page }) => {
    await setupBankingMocks(page)
    await page.goto(BASE)
  })

  test('TC-M12: กรอก OTP ถูก → verified', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/otp/verify`, {
      method: 'POST',
      body:   { otp: '123456' }
    })
    expect(res.status).toBe(200)
    expect(res.json.verified).toBe(true)
  })

  test('TC-M13: กรอก OTP ผิด → error', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/otp/verify`, {
      method: 'POST',
      body:   { otp: '000000' }
    })
    expect(res.status).toBe(400)
    expect(res.json.error).toBe('OTP ไม่ถูกต้อง')
  })

})

// ── Loan Application ──────────────────────────────────────────────

test.describe('Mock: Loan Application', () => {

  test.beforeEach(async ({ page }) => {
    await setupBankingMocks(page)
    await page.goto(BASE)
  })

  test('TC-M14: สมัครสินเชื่อรายได้ 50,000 → สำเร็จ', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/loan/apply`, {
      method: 'POST',
      body:   { firstName: 'สมชาย', lastName: 'ใจดี', income: 50000, amount: 500000, tenure: 60 }
    })
    expect(res.status).toBe(201)
    expect(res.json.applicationNumber).toMatch(/^LOAN-\d+$/)
    expect(res.json.status).toBe('pending')
  })

  test('TC-M15: สมัครสินเชื่อรายได้ 5,000 → ต่ำกว่าเกณฑ์', async ({ page }) => {
    const res = await fetchViaPage(page, `${BASE}/api/loan/apply`, {
      method: 'POST',
      body:   { firstName: 'สมชาย', lastName: 'ใจดี', income: 5000, amount: 500000, tenure: 60 }
    })
    expect(res.status).toBe(400)
    expect(res.json.error).toBe('รายได้ขั้นต่ำ 15,000 บาท')
  })

})