from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    # Navigate to dashboard - light mode screenshot
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    
    # Force light mode
    page.evaluate("""
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    """)
    time.sleep(1)
    page.screenshot(path='/Volumes/alaaMac/driverr/taxi_web/screenshot_light.png', full_page=False)
    
    # Force dark mode
    page.evaluate("""
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
    """)
    time.sleep(1)
    page.screenshot(path='/Volumes/alaaMac/driverr/taxi_web/screenshot_dark.png', full_page=False)
    
    browser.close()
    print("✅ Screenshots saved!")
