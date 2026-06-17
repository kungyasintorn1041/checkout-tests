const { test, expect } = require('@playwright/test')
const { CheckoutPage } = require('../../pages/CheckoutPage')
const { LoginPage } = require('../../pages/LoginPage')
const { USERS, CHECKOUT_INFO } = require('../../test-data/cards')

test.describe('SCN-001: Happy Path — Checkout สำเร็จ', () => {

  // Login และเพิ่มสินค้าก่อนทุก test
  test.beforeEach(async ({ page }) => {
    // ใช้ LoginPage แทน raw locator
    const loginPage = new LoginPage(page)
    await loginPage.login(USERS.standard.username, USERS.standard.password)

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

  // TC-002
  test('TC-002: ตรวจยอดรวมบน checkout summary ก่อน finish', async ({ page }) => {
    const checkout = new CheckoutPage(page)

    await checkout.fillInfo(CHECKOUT_INFO.valid)
    await checkout.continue()

    // --- ตรวจ summary page (step 2) ---

    // ต้องมีชื่อสินค้าอยู่ใน summary
    await expect(page.locator('.cart_item')).toBeVisible()

    // Item total ต้องแสดงและเป็นตัวเลข เช่น "Item total: $29.99"
    const itemTotal = page.locator('.summary_subtotal_label')
    await expect(itemTotal).toBeVisible()
    await expect(itemTotal).toContainText('Item total:')

    // Tax ต้องแสดงและเป็นตัวเลข
    const tax = page.locator('.summary_tax_label')
    await expect(tax).toBeVisible()
    await expect(tax).toContainText('Tax:')

    // Total ต้องแสดงและมีค่า (ต้องมากกว่า $0)
    const total = page.locator('.summary_total_label')
    await expect(total).toBeVisible()
    await expect(total).toContainText('Total:')

    // ตรวจว่า total ไม่ใช่ $0.00 — ยอดต้องมีค่าจริงๆ
    const totalText = await total.textContent()
    const totalAmount = parseFloat(totalText.replace(/[^0-9.]/g, ''))
    expect(totalAmount).toBeGreaterThan(0)

    // กด finish แล้วตรวจ success
    await checkout.finish()
    await expect(checkout.successTitle).toHaveText('Thank you for your order!')
  })

})