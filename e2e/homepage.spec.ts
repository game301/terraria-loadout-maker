import { test, expect } from "@playwright/test"

test.describe("Homepage", () => {
    test("should load successfully", async ({ page }) => {
        await page.goto("/")

        // Check title
        await expect(page).toHaveTitle(/Terraria Loadout Maker/i)

        // Check main heading
        await expect(
            page.getByRole("heading", { name: /terraria loadout maker/i })
        ).toBeVisible()
    })

    test("should have navigation links", async ({ page }) => {
        await page.goto("/")

        // Check for main navigation elements in header navigation
        const nav = page.getByRole("navigation")
        await expect(
            nav.getByRole("link", { name: /browse loadouts/i })
        ).toBeVisible()
    })

    test("should navigate to browse loadouts page", async ({ page }) => {
        await page.goto("/")

        // Click on Browse Loadouts link in navigation (not the button in page content)
        await page
            .getByRole("navigation")
            .getByRole("link", { name: /browse loadouts/i })
            .click()

        // Verify navigation
        await expect(page).toHaveURL(/\/loadouts/)
    })
})
