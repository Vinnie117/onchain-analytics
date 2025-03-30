import numpy as np
import pandas as pd
from numpy.lib.stride_tricks import as_strided
import json
import yfinance as yf


def windowed_view(x, window_size):
    y = as_strided(x, shape=(x.size - window_size + 1, window_size), strides=(x.strides[0], x.strides[0]))
    return y


def rolling_max_dd_pct(x, window_size, min_periods=1):
    if min_periods < window_size:
        pad = np.full(window_size - min_periods, x[0])
        x = np.concatenate((pad, x))
    y = windowed_view(x, window_size)
    running_max_y = np.maximum.accumulate(y, axis=1)
    dd_pct = (y - running_max_y) / running_max_y
    return dd_pct.min(axis=1)


def portfolio_rolling_max_dd_from_series(series, window_size, min_periods=1):
    portfolio_drawdown_pct = rolling_max_dd_pct(series.values, window_size, min_periods)
    portfolio_dd_df = pd.DataFrame({
        'Portfolio_Value': series,
        'Rolling_Max_Drawdown_Pct': np.concatenate([
            np.full(len(series) - len(portfolio_drawdown_pct), np.nan),
            portfolio_drawdown_pct
        ])
    }, index=series.index)
    return portfolio_dd_df 


if __name__ == "__main__":

    spy_start = 100
    btc_start = 100

    # # Get SPY data
    # spy = yf.Ticker("SPY")
    # history_spy = spy.history(start="2019-01-31", end="2025-01-02")
    # price_spy = history_spy['Close']

    # # Get BTC data
    # btc = yf.Ticker("BTC-USD")
    # history_btc = btc.history(start="2019-01-31", end="2025-01-02")
    # price_btc = history_btc['Close']

    # # remove time and timezone
    # price_spy.index = price_spy.index.tz_localize(None).normalize()
    # price_btc.index = price_btc.index.tz_localize(None).normalize()


    # df = pd.concat([price_spy, price_btc], axis=1)
    # df.columns = ['SPY', 'BTC']

    # # forward fill last available observation in case of NaN (weekends)
    # df['SPY'] = df['SPY'].ffill()
    # df['BTC'] = df['BTC'].ffill()

    # df['SPY_daily_ret'] = 1 + df['SPY'].pct_change(1, fill_method=None)
    # df['BTC_daily_ret'] = 1 + df['BTC'].pct_change(1, fill_method=None)
    # df = df.reset_index().rename(columns={'index': 'Date'})

    # df.to_json('static/data/pf_data_static.json', index=False, orient='records', date_format='iso')

    # # use static data for this case
    df = pd.read_json('static/data/pf_data_static.json')

    # Compute SPY portfolio value
    df['SPY_pf'] = spy_start * df['SPY_daily_ret'].cumprod()
    df.loc[df.index[0], 'SPY_pf'] = spy_start  # Set first value correctly

    # Compute BTC portfolio value
    df['BTC_pf'] = btc_start * df['BTC_daily_ret'].cumprod()
    df.loc[df.index[0], 'BTC_pf'] = btc_start

    df['combined_pf'] = df['SPY_pf'] + df['BTC_pf'] 


    combined_pf_series = df['combined_pf']
    window_size = 20  # Adjust as needed

    portfolio_dd_df = portfolio_rolling_max_dd_from_series(combined_pf_series, window_size)

    print(portfolio_dd_df)

    # data for js plot
    df.to_json('static/data/pf_dd_data.json', index=False, orient='records', date_format='iso')