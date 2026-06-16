const { test, expect } = require('@playwright/test')
const { CheckoutPage } = require('../../pages/CheckoutPage')
const { USERS, CHECKOUT_INFO } = require('../../test-data/cards')

test.describe('SCN-001: Happy Path — Checkout สำเร็จ', () => {

  // Login และเพิ่มสินค้าก่อนทุก test
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/') 
    await page.locator('#user-name').fill(USERS.standard.username)
    await page.locator('#password').fill(USERS.standard.password)
    await page.locator('#login-button').click()

    // เพิ่มสินค้าในตะกร้า
    await page.locator('.btn_primary').first().click()

    // ไปหน้า cart
    await page.locator('.shopping_cart_link').click()

    // กด checkout
    await page.locator('#checkout').click()
  })

  // TC-001
  test('TC-001: Checkout ด้วยข้อมูลครบถ้วน → สำเร็จ', async ({ page }) => {
    const checkout = new CheckoutPage(page)

    await checkout.fillInfo(CHECKOUT_INFO.valid)
    await checkout.continue()
    await checkout.finish()

    await expect(checkout.successTitle).toBeVisible()
    await expect(checkout.successTitle).toHaveText('Thank you for your order!')
  })

})