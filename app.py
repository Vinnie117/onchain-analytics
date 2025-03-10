from flask import Flask, render_template, request, jsonify
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
        scrape_data(user_input=user_input)
        return jsonify({'message': 'Data updated successfully.'}), 200
            
    except Exception as e:
        return jsonify({'message': 'Error occurred while scraping data: ' + str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
