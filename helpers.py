import pandas as pd
import requests
from bs4 import BeautifulSoup

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
        print(f"Processing {url}")

        response = requests.get(url)
        soup = BeautifulSoup(response.content, "html.parser")

        df_tblOne = _process_table(table_ids[0], soup)
        df_tblOne2 = _process_table(table_ids[1], soup, fallback_headers=headers)

        df_page = pd.concat([df_tblOne, df_tblOne2], ignore_index=True)
        destination.append(df_page)

    return destination

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