import pandas as pd
import yfinance as yf

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

spy_pf_start = 100
df['SPY_pf'] = spy_pf_start * df['SPY_daily_ret'].cumprod()
df.loc[df.index[0], 'SPY_pf'] = spy_pf_start  # Proper and safe way to set the first value
btc_pf_start = 100
df['BTC_pf'] = btc_pf_start * df['BTC_daily_ret'].cumprod()
df.loc[df.index[0], 'BTC_pf'] = btc_pf_start

df = df.reset_index()
print(df.head(10))
print(df.dtypes)
print(df.tail(10))

df.to_json('static/data/pf_data.json', index=False, orient='records')
