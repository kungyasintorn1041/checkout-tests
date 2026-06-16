class CheckoutPage {
  constructor(page) {
    this.page = page

    // Locators ของ saucedemo
    this.firstNameInput = page.locator('#first-name')
    this.lastNameInput  = page.locator('#last-name')
    this.zipCodeInput   = page.locator('#postal-code')
    this.continueButton = page.locator('#continue')
    this.finishButton   = page.locator('#finish')
    this.errorMessage   = page.locator('[data-test="error"]')
    this.successTitle   = page.locator('.complete-header')
  }

  async goto() {
    await this.page.goto('/checkout-step-one.html')
  }

  async fillInfo(info) {
    if (info.firstName) await this.firstNameInput.fill(info.firstName)
    if (info.lastName)  await this.lastNameInput.fill(info.lastName)
    if (info.zipCode)   await this.zipCodeInput.fill(info.zipCode)
  }

  async continue() {
    await this.continueButton.click()
  }

  async finish() {
    await this.finishButton.click()
  }

  async checkout(info) {
    await this.goto()
    await this.fillInfo(info)
    await this.continue()
  }
}

module.exports = { CheckoutPage }