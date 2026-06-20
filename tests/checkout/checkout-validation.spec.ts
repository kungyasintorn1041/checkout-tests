import { test, expect } from '@playwright/test'
import { CheckoutPage } from '../../pages/CheckoutPage'
import { LoginPage }    from '../../pages/LoginPage'
import { USERS, CHECKOUT_INFO } from '../../test-data/cards'

test.describe('SCN-002: Validation — ข้อมูล checkout ไม่ครบ', () => {

  let checkout: CheckoutPage

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.login(USERS.standard.username, USERS.standard.password)

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

test.describe('SCN-005: problem_user — UI มีปัญหา', () => {

  // TC-007
  test('TC-007: problem_user login สำเร็จ แต่รูปสินค้าแสดงผิด', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.login(USERS.problem.username, USERS.problem.password)

    await expect(page).toHaveURL(/inventory/)

    const firstImg = page.locator('.inventory_item img').first()
    const src: string | null = await firstImg.getAttribute('src')
    expect(src).toContain('sl-404')
  })

  // TC-008
  test('TC-008: problem_user checkout ไม่สำเร็จ — Last Name field มีปัญหา', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.login(USERS.problem.username, USERS.problem.password)

    await page.locator('.btn_primary').first().click()
    await page.locator('.shopping_cart_link').click()
    await page.locator('#checkout').click()

    const checkout = new CheckoutPage(page)
    await checkout.fillInfo(CHECKOUT_INFO.valid)
    await checkout.continue()

    const lastNameValue: string = await checkout.lastNameInput.inputValue()
    expect(lastNameValue).toBe('')
  })

})
