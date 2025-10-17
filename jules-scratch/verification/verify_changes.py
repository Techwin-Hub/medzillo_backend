from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        # Login
        page.goto("http://localhost:3000/", timeout=60000)
        page.wait_for_load_state()
        page.screenshot(path="jules-scratch/verification/login_page.png")
        page.get_by_placeholder("Email address").fill("test@test.com")
        page.get_by_placeholder("Password").fill("password")
        page.get_by_role("button", name="Sign in").click()
        try:
            page.wait_for_url("http://localhost:3000/clinic-dashboard", timeout=10000)
        except Exception as e:
            print(f"Error waiting for dashboard: {e}")
            page.screenshot(path="jules-scratch/verification/after_login_attempt.png")


        page.goto("http://localhost:3000/appointments")
        page.wait_for_selector('text=Appointments')

        # Verify Vitals Button Change
        add_vitals_button = page.get_by_role("button", name="Add Vitals").first
        add_vitals_button.click()
        page.get_by_label("Blood Pressure (systolic/diastolic)").fill("120/80")
        page.get_by_role("button", name="Save").click()
        page.wait_for_selector('text=Vitals Added')
        page.screenshot(path="jules-scratch/verification/vitals_added.png")

        # Verify Delete Batch
        page.goto("http://localhost:3000/medicines")
        page.wait_for_selector('text=Medicines')

        # Check if there is a medicine to manage stock for.
        if page.get_by_role("button", name="Manage Stock").count() == 0:
            # Create a medicine if none exist
            page.get_by_role("button", name="Add New Medicine").click()
            page.get_by_label("Name").fill("Test Medicine")
            page.get_by_label("Manufacturer").fill("Test Manufacturer")
            page.get_by_role("button", name="Save").click()
            page.wait_for_selector('text=Test Medicine')


        manage_stock_button = page.get_by_role("button", name="Manage Stock").first
        manage_stock_button.click()

        # Add a batch to ensure one exists to be deleted.
        page.get_by_label("Batch Number").fill("DELETE_TEST_123")

        # Check if there is a supplier to select.
        if page.locator('select[name="supplierId"] option').count() <= 1:
            # Create a supplier if none exist
            page.goto("http://localhost:3000/suppliers")
            page.wait_for_selector('text=Suppliers')
            page.get_by_role("button", name="Add New Supplier").click()
            page.get_by_label("Name").fill("Test Supplier")
            page.get_by_label("Contact Person").fill("Test Person")
            page.get_by_label("Email").fill("test@supplier.com")
            page.get_by_label("Phone").fill("1234567890")
            page.get_by_role("button", name="Save").click()
            page.wait_for_selector('text=Test Supplier')
            page.goto("http://localhost:3000/medicines")
            page.wait_for_selector('text=Medicines')
            manage_stock_button = page.get_by_role("button", name="Manage Stock").first
            manage_stock_button.click()
            page.get_by_label("Batch Number").fill("DELETE_TEST_123")


        page.get_by_label("Supplier").select_option(index=1)
        page.get_by_label("Expiry Date").fill("2025-12-31")
        page.get_by_label("Number of Packs").fill("10")
        page.get_by_label("Units per Pack").fill("10")
        page.get_by_label("Purchase Rate / Pack (₹)").fill("100")
        page.get_by_label("MRP / Pack (₹)").fill("120")
        page.get_by_role("button", name="Add Batch").click()
        page.wait_for_selector('text=DELETE_TEST_123')


        delete_button = page.get_by_title("Delete batch DELETE_TEST_.123")
        delete_button.click()

        confirm_button = page.get_by_role("button", name="Confirm")
        confirm_button.click()

        page.wait_for_function("() => !document.body.innerText.includes('DELETE_TEST_123')")

        page.screenshot(path="jules-scratch/verification/batch_deleted.png")

        browser.close()

run()