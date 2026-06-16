const { test, expect } = require('@playwright/test')
const { CheckoutPage } = require('../../pages/CheckoutPage')
const { USERS, CHECKOUT_INFO } = require('../../test-data/cards')

test.describe('SCN-002: Validation — ข้อมูล checkout ไม่ครบ', () => {

  let checkout

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/')
    await page.locator('#user-name').fill(USERS.standard.username)
    await page.locator('#password').fill(USERS.standard.password)
    await page.locator('#login-button').click()

    // เพิ่มสินค้า → cart → checkout
    await page.locator('.btn_primary').first().click()
    await page.locator('.shopping_cart_link').click()
    await page.locator('#checkout').click()

    checkout = new CheckoutPage(page)
  })

  // TC-003
  test('TC-003: ไม่กรอก First Name → error', async () => {
    await checkout.fillInfo(CHECKOUT_INFO.missingFirst)
    await checkout.continue()

    await expect(checkout.errorMessage).toBeVisible()
    await expect(checkout.errorMessage).toContainText('First Name is required')
  })

  // TC-004
  test('TC-004: ไม่กรอก Last Name → error', async () => {
    await checkout.fillInfo(CHECKOUT_INFO.missingLast)
    await checkout.continue()

    await expect(checkout.errorMessage).toContainText('Last Name is required')
  })

  // TC-005
  test('TC-005: ไม่กรอก Zip Code → error', async () => {
    await checkout.fillInfo(CHECKOUT_INFO.missingZip)
    await checkout.continue()

    await expect(checkout.errorMessage).toContainText('Postal Code is required')
  })

})

test.describe('SCN-003: User ถูก lock ออกจากระบบ', () => {

  // TC-006
  test('TC-006: locked_out_user login ไม่ได้ → error', async ({ page }) => {
    await page.goto('/')
    await page.locator('#user-name').fill(USERS.locked.username)
    await page.locator('#password').fill(USERS.locked.password)
    await page.locator('#login-button').click()

    const error = page.locator('[data-test="error"]')
    await expect(error).toBeVisible()
    await expect(error).toContainText('Sorry, this user has been locked out')
  })

})