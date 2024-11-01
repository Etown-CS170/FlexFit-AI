from flask import Flask, render_template, request, jsonify, url_for
import requests

app = Flask(__name__, static_url_path='/static')

def get_ai_response(message):
    url = "http://localhost:1234/v1/chat/completions"
    
    data = {
        "messages": [{"role": "user", "content": message}],
        "temperature": 0.7,
        "max_tokens": 2000,
    }
    
    response = requests.post(
        url, 
        headers={"Content-Type": "application/json"}, 
        json=data
    )
    return response.json()['choices'][0]['message']['content']

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    message = request.json['message']
    response = get_ai_response(message)
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)