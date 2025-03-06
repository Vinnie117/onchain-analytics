import requests
from bs4 import BeautifulSoup
import pandas as pd
from helpers import clean_data, process_bitcoin_table


# define request
base_url = "https://bitinfocharts.com/top-100-richest-bitcoin-addresses{}.html"
headers = ['', 'Address', 'Balance', '% of coins', 'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs']


# extract data
list_df = []
for i in range(1, 4):
    # Adjust URL for the first page (no page number)
    url = base_url.format("" if i == 1 else f"-{i}")
    print(f"Processing {url}")

    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    # process tables, using fallback headers where none are available
    df_tblOne = process_bitcoin_table("tblOne", soup)
    df_tblOne2 = process_bitcoin_table("tblOne2", soup, fallback_headers=headers)

    df_page = pd.concat([df_tblOne, df_tblOne2], ignore_index=True)
    list_df.append(df_page)

# concat all collected dfs
df = pd.concat(list_df, ignore_index=True)

# prepare data
df = clean_data(df)

# output results
print("Extracted Table from: " + url)
print(df)
print(df.dtypes)