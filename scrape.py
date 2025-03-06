import requests
from bs4 import BeautifulSoup
import pandas as pd

# disable scientific notation and use thousand separators
pd.options.display.float_format = '{:,.0f}'.format

# Function to process tables by table id
def process_bitcoin_table(table_id, soup, fallback_headers=None):

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
    df = df[[col for col in df.columns if col not in [None, ""]]]

    # handle variables
    df[['BTC', 'USD Value']] = df['Balance'].str.split(' BTC ($', expand=True, regex=False)
    df['BTC'] = df['BTC'].str.replace(',', '').astype(float)
    df['USD Value'] = df['USD Value'].str.replace(',', '').str.replace(')', '').astype(float)
    #df['USD Value'] = df['USD Value'].map('{:,.2f}'.format)
    df.drop(columns=['Balance'], inplace=True)

    df['% of coins'] = df['% of coins'].str.replace('%', '').astype(float)
    df['Ins'] = pd.to_numeric(df['Ins'], errors='coerce').fillna(0).astype(int)
    df['Outs'] = pd.to_numeric(df['Outs'], errors='coerce').fillna(0).astype(int)

    datetime_columns = ['First In', 'Last In', 'First Out', 'Last Out']
    df[datetime_columns] = df[datetime_columns].apply(pd.to_datetime, errors='coerce')

    print(df.head(3))
    print(df.dtypes)

    return df

# make request
url = "https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html"
response = requests.get(url)
soup = BeautifulSoup(response.content, "html.parser")

# Process tables, using fallback headers where none are available
headers = ['', 'Address', 'Balance', '% of coins', 'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs']
df_tblOne = process_bitcoin_table("tblOne", soup)
df_tblOne2 = process_bitcoin_table("tblOne2", soup, fallback_headers=headers)

# Concatenate both tables
df = pd.concat([df_tblOne, df_tblOne2], ignore_index=True)

# Output results
print("Extracted Table from: " + url)
print(df)