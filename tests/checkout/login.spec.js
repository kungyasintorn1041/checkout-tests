const { test, expect } = require('@playwright/test')
const { LoginPage } = require('../../pages/LoginPage')
const { USERS } = require('../../test-data/cards')

test.describe('SCN-004: ทดสอบการ Login', () => {

    let loginPage

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page)
        await loginPage.goto()
    })

    // TC-009
    test('TC-009: Login ด้วย standard_user → สำเร็จ', async ({ page }) => {
        await loginPage.login(
            USERS.standard.username,
            USERS.standard.password
        )

        await expect(page).toHaveURL(/inventory/)
        await expect(page.locator('.inventory_list')).toBeVisible()
    })

    // TC-010
    test('TC-010: Login ด้วย username ผิด → error', async () => {
        await loginPage.login('wrong_user', 'secret_sauce')

        await expect(loginPage.errorMessage).toBeVisible()
        await expect(loginPage.errorMessage).toContainText(
            'Username and password do not match'
        )
    })

    // TC-011
    test('TC-011: ไม่กรอก username → error', async () => {
        await loginPage.login('', 'secret_sauce')

        await expect(loginPage.errorMessage).toBeVisible()
        await expect(loginPage.errorMessage).toContainText('Username is required')
    })

})