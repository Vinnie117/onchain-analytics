from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from backend.helpers import _process_table
import pandas as pd
import asyncio
import math

list_df = []
base_url = "https://bitinfocharts.com/top-100-richest-bitcoin-addresses{}.html"
table_ids = ['tblOne', 'tblOne2']
headers = ['', 'Address', 'Balance', '% of coins', 'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs']
user_input = '200'
num_pages = math.ceil(int(user_input) / 100)


async def playwright_scrape(base_url, table_ids, headers, num_pages, destination):
    async with async_playwright() as p:  # Use async context manager
        browser = await p.chromium.launch(headless=True)  # Run headless


        for i in range(1, num_pages + 1):
            page = await browser.new_page()

            url = base_url.format("" if i == 1 else f"-{i}")
            
            await page.goto(url)  # Must await
            
            print("Page Title:", await page.title())  # Must await

            html = await page.content()
            soup = BeautifulSoup(html, "html.parser")

            df_tblOne = _process_table(table_ids[0], soup)
            df_tblOne2 = _process_table(table_ids[1], soup, fallback_headers=headers)
            df_page = pd.concat([df_tblOne, df_tblOne2], ignore_index=True)

            destination.append(df_page)


        print(df_page)
        await browser.close()  # Must await

if __name__ == "__main__":
    asyncio.run(playwright_scrape(base_url, table_ids, headers, num_pages, list_df))  # Run async function
