import math
import pandas as pd
from backend.helpers import clean_data, scrape_tables, make_features, server_scrape_tables

def scrape_data(user_input):
    # Define request parameters
    base_url = "https://bitinfocharts.com/top-100-richest-bitcoin-addresses{}.html"
    headers = ['', 'Address', 'Balance', '% of coins', 'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs']
    list_table_id = ['tblOne', 'tblOne2']
    num_pages = math.ceil(int(user_input) / 100)

    # Start streaming messages
    yield "data: Starting the data scraping process...\n\n"

    # Extract data with streaming messages
    list_df = []
    for message in scrape_tables(base_url, list_table_id, headers, num_pages, list_df):
        yield f"data: {message}\n\n"

    # Prepare and process the data
    df = pd.concat(list_df, ignore_index=True)
    df = clean_data(df)
    df = make_features(df)
    df = df[['Address', 'Short Address', 'BTC', 'USD Value', '% of coins', 
             'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs',
             'Days Since First In', 'Days Since Last In', 'Days Since Last Out', 
             'Address Type', 'Txs Difference', 'Days Out Minus In', 
             'HODL_Days', 'Age Band']]
    df = df.head(int(user_input))

    # Output results
    df.to_json('static/data/rich_list.json', index=False, orient='records')
    yield "data: Data scraping completed successfully.\n\n"





async def server_scrape_data(user_input):
    base_url = "https://bitinfocharts.com/top-100-richest-bitcoin-addresses{}.html"
    headers = ['', 'Address', 'Balance', '% of coins', 'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs']
    list_table_id = ['tblOne', 'tblOne2']
    num_pages = math.ceil(int(user_input) / 100)

    yield "data: Starting the data scraping process...\n\n"

    list_df = []

    # Stream messages from `server_scrape_tables`
    async for message in server_scrape_tables(base_url, list_table_id, headers, num_pages, list_df):
        yield message

    # After scraping finishes, process the data
    df = pd.concat(list_df, ignore_index=True)
    df = clean_data(df)

    df = make_features(df)
    df = df[['Address', 'Short Address', 'BTC', 'USD Value', '% of coins',
             'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs',
             'Days Since First In', 'Days Since Last In', 'Days Since Last Out',
             'Address Type', 'Txs Difference', 'Days Out Minus In',
             'HODL_Days', 'Age Band']]
    df = df.head(int(user_input))

    # Save results to JSON
    df.to_json('static/data/rich_list.json', index=False, orient='records')

    yield "data: Data scraping completed successfully.\n\n"

