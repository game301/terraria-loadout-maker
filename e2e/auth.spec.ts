import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
    test("should display login page", async ({ page }) => {
        await page.goto("/auth/login")

        // Check for login form elements (CardTitle contains the text, not h1)
        await expect(page.getByText("Login").first()).toBeVisible()
        await expect(page.getByLabel(/email/i)).toBeVisible()
        await expect(page.getByLabel(/password/i)).toBeVisible()
    })

    test("should display sign up page", async ({ page }) => {
        await page.goto("/auth/sign-up")

        // Check for sign up form elements
        await expect(page.getByText(/sign up/i).first()).toBeVisible()
        await expect(page.getByLabel(/email/i)).toBeVisible()
        await expect(page.getByLabel("Password", { exact: true })).toBeVisible()
    })

    test("should validate email format on login", async ({ page }) => {
        await page.goto("/auth/login")

        // Try to submit with invalid email
        await page.getByLabel(/email/i).fill("invalid-email")
        await page.getByLabel(/password/i).fill("password123")

        // Try to submit
        const submitButton = page.getByRole("button", {
            name: /login|sign in/i,
        })
        await submitButton.click()

        // Should still be on login page due to validation
        await expect(page).toHaveURL(/\/auth\/login/)
    })

    test("should navigate between login and signup", async ({ page }) => {
        await page.goto("/auth/login")

        // Click sign up link in the form (not navigation)
        const signUpLink = page
            .locator("form")
            .getByRole("link", { name: /sign up/i })
        await signUpLink.click()
        await expect(page).toHaveURL(/\/auth\/sign-up/)
    })
})
