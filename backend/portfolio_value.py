import pandas as pd
import yfinance as yf

def compute_portfolio(spy_start, btc_start):

    # Get SPY data
    spy = yf.Ticker("SPY")
    history_spy = spy.history(period='5y')
    price_spy = history_spy['Close']

    # Get BTC data
    btc = yf.Ticker("BTC-USD")
    history_btc = btc.history(period='5y')
    price_btc = history_btc['Close']

    # remove time and timezone
    price_spy.index = price_spy.index.tz_localize(None).normalize()
    price_btc.index = price_btc.index.tz_localize(None).normalize()


    df = pd.concat([price_spy, price_btc], axis=1)
    df.columns = ['SPY', 'BTC']

    # forward fill last available observation in case of NaN (weekends)
    df['SPY'] = df['SPY'].ffill()
    df['BTC'] = df['BTC'].ffill()

    df['SPY_daily_ret'] = 1 + df['SPY'].pct_change(1, fill_method=None)
    df['BTC_daily_ret'] = 1 + df['BTC'].pct_change(1, fill_method=None)
    df = df.reset_index().rename(columns={'index': 'Date'})

    # # Read a pf from a JSON file
    # df = pd.read_json(df_path)

    # Select relevant columns
    df = df[['Date', 'SPY_daily_ret', 'BTC_daily_ret']]

    # Compute SPY portfolio value
    df['SPY_pf'] = spy_start * df['SPY_daily_ret'].cumprod()
    df.loc[df.index[0], 'SPY_pf'] = spy_start  # Set first value correctly

    # Compute BTC portfolio value
    df['BTC_pf'] = btc_start * df['BTC_daily_ret'].cumprod()
    df.loc[df.index[0], 'BTC_pf'] = btc_start

    df['combined_pf'] = df['SPY_pf'] + df['BTC_pf'] 

    return df

# # Example usage
# df = compute_portfolio('static/data/pf_data.json', spy_start=100, btc_start=100)
# print(df.head(10))
# print(df.tail(10))
# df.to_json('static/data/pf_value.json', orient='records', date_format='iso')
