import requests
from bs4 import BeautifulSoup
import pandas as pd
from helpers import clean_data

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
    return df

# make request
url = "https://bitinfocharts.com/top-100-richest-bitcoin-addresses{}.html"
response = requests.get(url)
soup = BeautifulSoup(response.content, "html.parser")

# Process tables, using fallback headers where none are available
headers = ['', 'Address', 'Balance', '% of coins', 'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs']
df_tblOne = process_bitcoin_table("tblOne", soup)
df_tblOne2 = process_bitcoin_table("tblOne2", soup, fallback_headers=headers)

# Concatenate both tables
df = pd.concat([df_tblOne, df_tblOne2], ignore_index=True)

# prepare data
list_df = []

# Iterate through pages 1 to 3
for i in range(1, 4):
    # Adjust URL for the first page (no page number)
    url = url.format("" if i == 1 else f"-{i}")
    print(f"Processing {url}")

    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    df_tblOne = process_bitcoin_table("tblOne", soup)
    df_tblOne2 = process_bitcoin_table("tblOne2", soup, fallback_headers=headers)

    df_page = pd.concat([df_tblOne, df_tblOne2], ignore_index=True)
    list_df.append(df_page)

# Concatenate all collected DataFrames
df = pd.concat(list_df, ignore_index=True)

df = clean_data(df)

# Output results
print("Extracted Table from: " + url)
print(df)
print(df.dtypes)