from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Login as super admin
        page.goto("http://localhost:3000/superadmin/login")
        page.wait_for_load_state()
        page.get_by_label("Email").fill("superadmin@medzillo.com")
        page.get_by_label("Password").fill("password")
        page.get_by_role("button", name="Login").click()
        page.wait_for_url("http://localhost:3000/superadmin/dashboard")

        # Verify dashboard data
        page.wait_for_selector('text=Total Clinics')
        page.screenshot(path="jules-scratch/verification/superadmin_dashboard.png")

        browser.close()

run()