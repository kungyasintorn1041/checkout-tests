import { Page } from '@playwright/test'

export async function setupBankingMocks(page: Page): Promise<void> {

  // ── mock POST /api/auth/login ────────────────────────────────
  await page.route('**/api/auth/login', async route => {
    const body = route.request().postDataJSON()

    // เช็ค locked_user ก่อนเสมอ
    if (body?.username === 'locked_user') {
      await route.fulfill({
        status:      403,
        contentType: 'application/json',
        body:        JSON.stringify({ message: 'บัญชีถูกระงับชั่วคราว' })
      })
    } else if (body?.password === 'Pass@1234') {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({
          token:     'mock-token-xyz-999',
          userId:    'U001',
          name:      'สมชาย ใจดี',
          expiresIn: 3600
        })
      })
    } else {
      await route.fulfill({
        status:      401,
        contentType: 'application/json',
        body:        JSON.stringify({ message: 'Invalid credentials' })
      })
    }
  })

  // ── mock GET /api/balance ────────────────────────────────────
  await page.route('**/api/balance', async route => {
    const token = route.request().headers()['authorization']

    if (!token) {
      await route.fulfill({
        status: 401,
        body:   JSON.stringify({ message: 'Unauthorized' })
      })
      return
    }

    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify({
        balance:       50000,
        currency:      'THB',
        accountNumber: '0000000001',
        accountName:   'สมชาย ใจดี'
      })
    })
  })

  // ── mock POST /api/transfer ──────────────────────────────────
  await page.route('**/api/transfer', async route => {
    const token = route.request().headers()['authorization']

    if (!token) {
      await route.fulfill({
        status: 401,
        body:   JSON.stringify({ message: 'Unauthorized' })
      })
      return
    }

    const body   = route.request().postDataJSON()
    const amount: number = body?.amount ?? 0

    if (amount <= 0) {
      await route.fulfill({
        status: 400,
        body:   JSON.stringify({ error: 'กรุณากรอกจำนวนเงิน' })
      })
    } else if (amount > 50000) {
      await route.fulfill({
        status: 400,
        body:   JSON.stringify({ error: 'ยอดเงินไม่เพียงพอ' })
      })
    } else if (amount > 30000) {
      await route.fulfill({
        status: 400,
        body:   JSON.stringify({ error: 'เกินวงเงินต่อวัน' })
      })
    } else if (body?.toAccount === '0000000001') {
      await route.fulfill({
        status: 400,
        body:   JSON.stringify({ error: 'ไม่สามารถโอนหาตัวเองได้' })
      })
    } else {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify({
          success:          true,
          refNo:            `REF${Date.now()}`,
          amount:           amount,
          remainingBalance: 50000 - amount,
          timestamp:        new Date().toISOString()
        })
      })
    }
  })

  // ── mock POST /api/otp/verify ────────────────────────────────
  await page.route('**/api/otp/verify', async route => {
    const body = route.request().postDataJSON()

    if (body?.otp === '123456') {
      await route.fulfill({
        status: 200,
        body:   JSON.stringify({ verified: true })
      })
    } else {
      await route.fulfill({
        status: 400,
        body:   JSON.stringify({ error: 'OTP ไม่ถูกต้อง' })
      })
    }
  })

  // ── mock POST /api/loan/apply ────────────────────────────────
  await page.route('**/api/loan/apply', async route => {
    const body   = route.request().postDataJSON()
    const income: number = body?.income ?? 0

    if (income < 15000) {
      await route.fulfill({
        status: 400,
        body:   JSON.stringify({ error: 'รายได้ขั้นต่ำ 15,000 บาท' })
      })
    } else {
      await route.fulfill({
        status: 201,
        body:   JSON.stringify({
          applicationNumber: `LOAN-${Date.now()}`,
          status:            'pending',
          message:           'ส่งใบสมัครเรียบร้อย'
        })
      })
    }
  })
}