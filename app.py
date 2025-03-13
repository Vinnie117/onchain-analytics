from flask import Flask, render_template, request, jsonify, Response, stream_with_context 
import subprocess
from backend.scrape import scrape_data


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/run-script', methods=['POST'])
def run_script():
    data = request.json
    user_input = data.get('user_input', '300')  # Default to 300 if no input

    try:
        # Stream the data scraping process as server-sent events (SSE)
        return Response(stream_with_context(scrape_data(user_input)),
                        content_type='text/event-stream')
    except Exception as e:
        return f"data: Error occurred: {str(e)}\n\n", 500

if __name__ == '__main__':
    app.run(debug=True)
