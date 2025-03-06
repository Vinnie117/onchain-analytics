import requests
from bs4 import BeautifulSoup
import pandas as pd

# make request
url = "https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html"
response = requests.get(url)

# extract table
soup = BeautifulSoup(response.content, "html.parser")
table = soup.find("table", id="tblOne")

# process table
headers = [header.text.strip() for header in table.find_all("th")]
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
df['USD Value'] = df['USD Value'].map('{:,.2f}'.format)
df.drop(columns=['Balance'], inplace=True)

df['% of coins'] = df['% of coins'].str.replace('%', '').astype(float)
df['Ins'] = pd.to_numeric(df['Ins'], errors='coerce').fillna(0).astype(int)
df['Outs'] = pd.to_numeric(df['Outs'], errors='coerce').fillna(0).astype(int)

datetime_columns = ['First In', 'Last In', 'First Out', 'Last Out']
df[datetime_columns] = df[datetime_columns].apply(pd.to_datetime, errors='coerce')



print(df.dtypes)
print(df.head(10))