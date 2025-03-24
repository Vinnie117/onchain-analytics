import requests
from bs4 import BeautifulSoup
import pandas as pd
from io import StringIO
import emoji

url = "https://bitcointreasuries.net/"

def remove_emojis(text):
    return emoji.replace_emoji(text, replace='').strip()

# Flag emoji extraction and conversion
def is_flag_emoji(char):
    return 127462 <= ord(char) <= 127487

def extract_flag(text):
    flags = [c for c in text if is_flag_emoji(c)]
    return ''.join(flags[:2]) if len(flags) >= 2 else ''

def flag_to_country_code(flag):
    if len(flag) != 2:
        return ''
    OFFSET = ord('🇦') - ord('A')
    return chr(ord(flag[0]) - OFFSET) + chr(ord(flag[1]) - OFFSET)

response = requests.get(url)

if response.status_code == 200:
    soup = BeautifulSoup(response.content, 'html.parser')
    container_div = soup.select_one('div.p-px.\@container')

    if container_div:
        table = container_div.find('table')

        if table:
            df = pd.read_html(StringIO(str(table)))[0]

            df = df[['Name', 'Bitcoin']]

            subtotal_index = df[df['Bitcoin'].str.contains('SUBTOTAL', na=False)].index[0]
            df = df.loc[:subtotal_index - 1]

            df['Name'] = df['Name'].astype(str).str.replace("Update ", "")

            # Extract flag emojis
            df['Flag'] = df['Name'].apply(extract_flag)
            df['Country_Code'] = df['Flag'].apply(flag_to_country_code)

            df['Name'] = df['Name'].apply(remove_emojis)

            df['Bitcoin'] = df['Bitcoin'].astype(str).str.replace("₿ ", "").str.replace(",", "")
            df['Bitcoin'] = df['Bitcoin'].astype(float)
            df = df[df['Bitcoin'] != 0]

            df = df[['Country_Code', 'Name', 'Bitcoin']]

            print(df.head(10))
            print(df.tail(10))

            df.to_csv('static/data/corporate_treasuries_20250324.csv', index=False)

        else:
            print("No table found within the div.")
    else:
        print("Div with class 'p-px @container' not found.")
else:
    print(f"Failed to retrieve webpage. Status code: {response.status_code}")
