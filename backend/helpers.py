import pandas as pd
import requests
from bs4 import BeautifulSoup
from backend.logger import logger
from pydoll.browser.chrome import Chrome
from pydoll.browser.options import Options
import tempfile
import shutil
import asyncio

# function to process tables by table id
def _process_table(table_id, soup, fallback_headers=None):

    # extract table
    table = soup.find("table", id=table_id)

    # process table
    headers = [header.text.strip() for header in table.find_all("th")]
    if not headers and fallback_headers:
        headers = fallback_headers

    rows = []
    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if cells:
            rows.append([cell.text.strip() for cell in cells])

    df = pd.DataFrame(rows, columns=headers)
    return df

def scrape_tables(base_url, table_ids, headers, num_pages, destination):

    # for loop over each single webpage
    for i in range(1, num_pages + 1):
        url = base_url.format("" if i == 1 else f"-{i}")
        logger.info(f"Processing {url}")
        yield f"Processing {url}"

        # request_headers = {
        #     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0",
        #     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        #     "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
        #     "Accept-Encoding": "gzip, deflate, br, zstd",
        #     "Alt-Used": "bitinfocharts.com",
        #     "Connection": "keep-alive",
        #     "Upgrade-Insecure-Requests": "1",
        #     "Sec-Fetch-Dest": "document",
        #     "Sec-Fetch-Mode": "navigate",
        #     "Sec-Fetch-Site": "none",
        #     "Sec-Fetch-User": "?1",
        #     "Priority": "u=0, i",
        #     "TE": "trailers"
        # }
        # cookies = {
        #     "_xicah": "c5a0badd-51955538",
        #     "nightmode": "1",
        #     "cf_clearance": "KNcL2FuGIZS3te1.ItEshcc7UuPE84e3PDteHQ7kfTw-1741251654-1.2.1.1-Y1yAZrGyKBPVX4B0gTNm1QtXNrwB988.I7aWv7vzihp8APw8teVz1am4nuAAPl3JCT.rX0OVx0NvILDnmG2Te6Oi7FASzhSu1gM9FDAkt9f9m1bYipXp0LUO3lAg_MHH2WEtSHoX9suVhps1sHGM4NnZGgFqfz72E.RCfAh_bCj_0ymrwINNuBZM6EAGeGo6bHyApDGk8WCAJnR0KQ_dGwQNMH6puHbxZG1WLll6bI3XclaGgo9hQrcJyJA2XYaA43da4FyGLS5j.D5sXf_UNTf_ecynBdg6DgwrVECeuNwQen5wq6izFI_f46m8rO4X1w9sX0EQZ8hoTbiEKlradzNxfqB3RRjOm5IZayLxH5HKRYrK9ZCyXoW96OB.0ab.QtDc1DWib6yzxrOBj_SuzWUP.22X03kUALy1VIEVK5pFw6fWwz.F9rjO5iP12kh8.WeedJRiSan4SrxmPT5Vjg",
        #     "showCoins": "eth,xrp,ltc,bch,doge"
        # }
        # response = requests.get(url, headers=request_headers, cookies=cookies)

        response = requests.get(url)

        response = requests.get(url)
        logger.info('response is: ' + str(response))
        soup = BeautifulSoup(response.content, "html.parser")

        df_tblOne = _process_table(table_ids[0], soup)
        df_tblOne2 = _process_table(table_ids[1], soup, fallback_headers=headers)

        df_page = pd.concat([df_tblOne, df_tblOne2], ignore_index=True)
        destination.append(df_page)

    return destination



async def server_scrape_tables(base_url, table_ids, headers, num_pages, destination):

    options = Options()
    options.binary_location = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

    # Create a temporary directory explicitly
    temp_dir = tempfile.mkdtemp()

    # Assign this temporary directory to the browser's user-data-dir
    options.add_argument(f'--user-data-dir={temp_dir}')

    browser = Chrome(options=options)
    await browser.start()

    try:
        for i in range(1, num_pages + 1):
            page = await browser.get_page()
            url = base_url.format("" if i == 1 else f"-{i}")
            await page.go_to(url)

            # Yield progress update
            yield f"data: Processing {url}\n\n"

            html = await page.page_source
            soup = BeautifulSoup(html, "html.parser")
            

            df_tblOne = _process_table(table_ids[0], soup)
            df_tblOne2 = _process_table(table_ids[1], soup, fallback_headers=headers)
            df_page = pd.concat([df_tblOne, df_tblOne2], ignore_index=True)
            destination.append(df_page)

            

    finally:
        await asyncio.sleep(2) 
        await browser.stop()
        shutil.rmtree(temp_dir, ignore_errors=True)  # Clean up explicitly
    

    yield "data: Scraping process completed.\n\n"
   


def clean_data(df):
    df = df[[col for col in df.columns if col not in [None, ""]]]

    # handle variables
    df[['BTC', 'USD Value']] = df['Balance'].str.split(' BTC ($', expand=True, regex=False)
    df['BTC'] = df['BTC'].str.replace(',', '').astype(float)
    df['USD Value'] = df['USD Value'].str.replace(',', '').str.replace(')', '').astype(float)
    df.drop(columns=['Balance'], inplace=True)
    df['Short Address'] = df['Address'].str[:8]

    df['% of coins'] = df['% of coins'].str.replace('%', '').astype(float)
    df['Ins'] = pd.to_numeric(df['Ins'], errors='coerce').fillna(0).astype(int)
    df['Outs'] = pd.to_numeric(df['Outs'], errors='coerce').fillna(0).astype(int)

    datetime_columns = ['First In', 'Last In', 'First Out', 'Last Out']
    df[datetime_columns] = df[datetime_columns].apply(pd.to_datetime, errors='coerce')

    return df

def make_features(df):

    try:
        df['First In'] = df['First In'].dt.tz_localize('UTC') 
        df['Last In'] = df['Last In'].dt.tz_localize('UTC') 
        df['Last Out'] = df['Last Out'].dt.tz_localize('UTC') 
    except:
        pass

    df['Days Since First In'] = (pd.Timestamp.now(tz='UTC').normalize() - df['First In'].dt.normalize()).dt.days
    df['Days Since Last In'] = (pd.Timestamp.now(tz='UTC').normalize() - df['Last In'].dt.normalize()).dt.days
    df['Days Since Last Out'] = (pd.Timestamp.now(tz='UTC').normalize() - df['Last Out'].dt.normalize()).dt.days
    df['Days Out Minus In'] = df['Days Since Last Out'] - df['Days Since Last In']

    df['Address Type'] = df['Short Address'].apply(_categorize_address)
    df['Txs Difference'] = df['Ins'] - df['Outs']

    # HODLing without outgoing txs begins with the first tx
    df['HODL_Days'] = df['Days Since Last Out'].fillna(df['Days Since First In']).astype(int)
    df['Age Band'] = _categorize_days_column(df['HODL_Days'])
    
    return df


def _categorize_address(address):
    if address.startswith('1'):
        return 'Legacy'
    elif address.startswith('3'):
        return 'SegWit'
    elif address.startswith('bc1p'):
        return 'Taproot'
    elif address.startswith('bc1'):
        return 'Bech32'
    else:
        return 'Unknown'
    
def _categorize_days_column(days_column):
    bins = [
        -1, 1, 7, 30, 90, 180, 365, 730, 1095, 1825, 2555, 3650, float('inf')
    ]
    labels = [
        '24hr',
        '1 day - 1 week',
        '1 week - 1 month',
        '1 month - 3 months',
        '3 months - 6 months',
        '6 months - 12 months',
        '1 year - 2 years',
        '2 years - 3 years',
        '3 years - 5 years',
        '5 years - 7 years',
        '7 years - 10 years',
        '+10 years'
    ]

    # categorize days
    return pd.cut(days_column, bins=bins, labels=labels, right=True)