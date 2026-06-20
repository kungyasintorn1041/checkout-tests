import { Page, Locator } from '@playwright/test'
import { CheckoutInfo } from '../test-data/cards'

export class CheckoutPage {
  readonly page:            Page
  readonly firstNameInput:  Locator
  readonly lastNameInput:   Locator
  readonly zipCodeInput:    Locator
  readonly continueButton:  Locator
  readonly finishButton:    Locator
  readonly errorMessage:    Locator
  readonly successTitle:    Locator

  constructor(page: Page) {
    this.page           = page
    this.firstNameInput = page.locator('#first-name')
    this.lastNameInput  = page.locator('#last-name')
    this.zipCodeInput   = page.locator('#postal-code')
    this.continueButton = page.locator('#continue')
    this.finishButton   = page.locator('#finish')
    this.errorMessage   = page.locator('[data-test="error"]')
    this.successTitle   = page.locator('.complete-header')
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout-step-one.html')
  }

  async fillInfo(info: CheckoutInfo): Promise<void> {
    if (info.firstName) await this.firstNameInput.fill(info.firstName)
    if (info.lastName)  await this.lastNameInput.fill(info.lastName)
    if (info.zipCode)   await this.zipCodeInput.fill(info.zipCode)
  }

  async continue(): Promise<void> {
    await this.continueButton.click()
  }

  async finish(): Promise<void> {
    await this.finishButton.click()
  }

  async checkout(info: CheckoutInfo): Promise<void> {
    await this.goto()
    await this.fillInfo(info)
    await this.continue()
  }
}
