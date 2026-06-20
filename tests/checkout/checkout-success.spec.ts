import { test, expect } from '@playwright/test'
import { CheckoutPage } from '../../pages/CheckoutPage'
import { LoginPage }    from '../../pages/LoginPage'
import { USERS, CHECKOUT_INFO } from '../../test-data/cards'

test.describe('SCN-001: Happy Path — Checkout สำเร็จ', () => {

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.login(USERS.standard.username, USERS.standard.password)

    await page.locator('.btn_primary').first().click()
    await page.locator('.shopping_cart_link').click()
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

    const itemTotal = page.locator('.summary_subtotal_label')
    await expect(itemTotal).toBeVisible()
    await expect(itemTotal).toContainText('Item total:')

    const tax = page.locator('.summary_tax_label')
    await expect(tax).toBeVisible()
    await expect(tax).toContainText('Tax:')

    const total = page.locator('.summary_total_label')
    await expect(total).toBeVisible()
    await expect(total).toContainText('Total:')

    const totalText: string = await total.textContent() ?? ''
    const totalAmount: number = parseFloat(totalText.replace(/[^0-9.]/g, ''))
    expect(totalAmount).toBeGreaterThan(0)

    await checkout.finish()
    await expect(checkout.successTitle).toHaveText('Thank you for your order!')
  })

})
