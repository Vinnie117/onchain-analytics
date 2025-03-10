import pandas as pd
from helpers import clean_data, scrape_tables, make_features


# define request
base_url = "https://bitinfocharts.com/top-100-richest-bitcoin-addresses{}.html"
headers = ['', 'Address', 'Balance', '% of coins', 'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs']
list_table_id = ['tblOne', 'tblOne2']

# extract data
list_df = []
list_df = scrape_tables(base_url=base_url, 
                        headers=headers, 
                        table_ids=list_table_id,
                        num_pages=3, 
                        destination=list_df)

# prepare data
df = pd.concat(list_df, ignore_index=True)
df = clean_data(df)
df = make_features(df)
df = df [['Address', 'Short Address', 'BTC', 'USD Value', '% of coins', 
          'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs',
          'Days Since First In', 'Days Since Last In', 'Days Since Last Out', 
          'Address Type', 'Txs Difference', 'Days Out Minus In', 
          'HODL_Days', 'Age Band']]

# output results
print(df.head(15))
print(df.dtypes)
#df.to_csv('data/rich_list.csv', index=False)
#df.to_json('data/rich_list.json', index=False, orient='records')