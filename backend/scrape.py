import pandas as pd
from backend.helpers import clean_data, scrape_tables, make_features
import math


def scrape_data(user_input):

    # define request
    base_url = "https://bitinfocharts.com/top-100-richest-bitcoin-addresses{}.html"
    headers = ['', 'Address', 'Balance', '% of coins', 'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs']
    list_table_id = ['tblOne', 'tblOne2']
    num_pages = math.ceil(int(user_input) / 100)

    # extract data
    list_df = []
    list_df = scrape_tables(base_url=base_url, 
                            headers=headers, 
                            table_ids=list_table_id,
                            num_pages=int(num_pages), 
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
    df = df.head(int(user_input))

    # output results
    print(df)
    print(df.dtypes)
    #df.to_csv('data/rich_list.csv', index=False)
    df.to_json('static/data/rich_list.json', index=False, orient='records')