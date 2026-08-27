import { expect, test } from "@playwright/test";

test("bookmark happy path", async ({ page }) => {
  const email = `ada-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Name").fill("Ada");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByRole("heading", { name: "All Bookmarks" })).toBeVisible();

  await page.getByRole("button", { name: "Create Folder" }).click();
  await page.getByLabel("Name").fill("Research");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("link", { name: "Research" })).toBeVisible();

  await page.getByRole("button", { name: "Add Bookmark" }).click();
  await page.getByLabel("URL").fill("https://fastapi.tiangolo.com/");
  await page.getByLabel("Title").fill("FastAPI");
  await page.getByRole("button", { name: "Save Bookmark" }).click();
  await expect(page.getByText("FastAPI")).toBeVisible();

  await page.getByLabel("Search Bookmarks").fill("FastAPI");
  await expect(page.getByText("FastAPI")).toBeVisible();

  await page.getByRole("button", { name: "Bookmark Actions" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByLabel("Title").fill("FastAPI docs");
  await page.getByRole("button", { name: "Save Bookmark" }).click();
  await expect(page.getByText("FastAPI docs")).toBeVisible();

  await page.getByRole("button", { name: "Add Favorite" }).click();
  await page.getByRole("link", { name: "Favorites" }).click();
  await expect(page.getByText("FastAPI docs")).toBeVisible();

  await page.getByRole("button", { name: "Bookmark Actions" }).click();
  await page.getByRole("menuitem", { name: "Archive" }).click();
  await page.getByRole("link", { name: "Archive" }).click();
  await expect(page.getByText("FastAPI docs")).toBeVisible();

  await page.getByRole("button", { name: "Bookmark Actions" }).click();
  await page.getByRole("menuitem", { name: "Restore" }).click();
  await page.getByRole("link", { name: "All Bookmarks" }).click();
  await expect(page.getByText("FastAPI docs")).toBeVisible();

  await page.getByRole("button", { name: "Bookmark Actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("You Haven't Saved Any Bookmarks Yet.")).toBeVisible();

  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
});
