from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, HTMLResponse
from backend.scrape import scrape_data, server_scrape_data
from backend.logger import logger
from fastapi.templating import Jinja2Templates
app = FastAPI()
app.logger = logger

# Mount static folder
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup template engine
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})



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


# @app.post('/playwright-script')
# async def run_sync_script(request: Request):
#     data = await request.json() 
#     user_input = data.get('user_input', '300')

#     return StreamingResponse(playwright_scrape_data(user_input), media_type='text/event-stream')


