import requests
from bs4 import BeautifulSoup
import pandas as pd
from io import StringIO 
import emoji


# Replace this URL with your actual URL
url = "https://bitcointreasuries.net/"

# Function to remove all emojis
def remove_emojis(text):
    return emoji.replace_emoji(text, replace='').strip()



# Fetch webpage content
response = requests.get(url)

if response.status_code == 200:
    soup = BeautifulSoup(response.content, 'html.parser')

    # Find the div with class 'p-px @container' using CSS selector
    container_div = soup.select_one('div.p-px.\@container')

    if container_div:
        # Find the first table within this div
        table = container_div.find('table')

        if table:
            # Convert HTML table to pandas DataFrame
            df = pd.read_html(StringIO(str(table)))[0]

            # Clean df
            df = df[['Name', 'Bitcoin']]

            # slice df by first occurence of "SUBTOTAL"
            subtotal_index = df[df['Bitcoin'].str.contains('SUBTOTAL', na=False)].index[0]
            df = df.loc[:subtotal_index - 1]
           
            df['Name'] = df['Name'].astype(str)
            df['Name'] = df['Name'].str.replace("Update ", "")
            df['Name'] = df['Name'].apply(remove_emojis)

            df['Bitcoin'] = df['Bitcoin'].astype(str)
            df['Bitcoin'] = df['Bitcoin'].str.replace("₿ ", "")
            df['Bitcoin'] = df['Bitcoin'].str.replace(",", "")
            df['Bitcoin'] = df['Bitcoin'].astype(float)
            df = df[df['Bitcoin'] != 0]

            # Display DataFrame
            print(df.head(10))
            print(df.tail(10))

            df.to_csv('static/data/corporate_treasuries_20250322.csv', index=False)


        else:
            print("No table found within the div.")
    else:
        print("Div with class 'p-px @container' not found.")
else:
    print(f"Failed to retrieve webpage. Status code: {response.status_code}")
