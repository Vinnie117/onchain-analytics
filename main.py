from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, HTMLResponse
from backend.scrape import scrape_data, server_scrape_data
from backend.logger import logger
from backend.portfolio_value import compute_portfolio
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from fastapi.responses import HTMLResponse, JSONResponse
import json

app = FastAPI()
app.logger = logger

# Mount static folder
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup template engine
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})



class AllocationInput(BaseModel):
    spy_start: float
    btc_start: float

@app.post("/api/update-portfolio")
async def update_portfolio(alloc: AllocationInput):
    try:
        # Compute portfolio
        df = compute_portfolio('static/data/pf_data.json', alloc.spy_start, alloc.btc_start)
        result_json_path = 'static/data/pf_value.json'
        
        # Write computed data to JSON
        df.to_json(result_json_path, orient='records', date_format='iso')

        # Respond back with the JSON data
        with open(result_json_path, 'r') as f:
            data = json.load(f)

        return JSONResponse(content={"status": "success", "data": data})

    except Exception as e:
        app.logger.error(f"Error updating portfolio: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post('/run-script')
async def run_script(request: Request):
    data = await request.json()
    user_input = data.get('user_input', '300')

    async def event_stream():
        try:
            for message in scrape_data(user_input):
                yield message
        except Exception as e:
            yield f"data: Error occurred: {str(e)}\n\n"

    return StreamingResponse(event_stream(), media_type='text/event-stream')




@app.post('/server-run-script')
async def run_async_script(request: Request):
    data = await request.json()
    user_input = data.get('user_input', '300')

    return StreamingResponse(server_scrape_data(user_input), media_type='text/event-stream')


from test_playwright import playwright_scrape
import math
# import asyncio
# asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

@app.post('/playwright-script')
async def run_playwright(request: Request):

    list_df = []
    base_url = "https://bitinfocharts.com/top-100-richest-bitcoin-addresses{}.html"
    table_ids = ['tblOne', 'tblOne2']
    headers = ['', 'Address', 'Balance', '% of coins', 'First In', 'Last In', 'Ins', 'First Out', 'Last Out', 'Outs']

    data = await request.json() 
    user_input = data.get('user_input', '300')
    num_pages = math.ceil(int(user_input) / 100)

    # Properly await the async function
    await playwright_scrape(base_url, table_ids, headers, num_pages, list_df)

    return {"message": "Script executed successfully"}


