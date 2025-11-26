import { test, expect } from "@playwright/test"

test.describe("Loadouts Page", () => {
    test("should display loadouts list", async ({ page }) => {
        await page.goto("/loadouts")

        // Check page title
        await expect(
            page.getByRole("heading", { name: /browse loadouts/i })
        ).toBeVisible()
    })

    test("should have filter options", async ({ page }) => {
        await page.goto("/loadouts")

        // Look for filter/search elements
        const searchInput = page.getByPlaceholder(/search/i)
        if (await searchInput.isVisible()) {
            await expect(searchInput).toBeEditable()
        }
    })

    test("should navigate to loadout creation page", async ({ page }) => {
        await page.goto("/loadouts")

        // Look for create button in navigation
        const createButton = page
            .getByRole("navigation")
            .getByRole("link", { name: /create loadout/i })
        await createButton.click()
        await expect(page).toHaveURL(/\/loadouts\/create/)
    })
})
