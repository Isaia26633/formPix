import requests
from urllib.parse import urlencode

FORM_PIX_URL = 'http://localhost:3000'
API_KEY = None

def login(url, key):
    global FORM_PIX_URL, API_KEY
    FORM_PIX_URL = url
    API_KEY = key

def send_command(command, params, req_options):
    try:
        url = f"{FORM_PIX_URL}/api/{command}?{params}"
        response = requests.request(method=req_options['method'], url=url, headers=req_options['headers'])
        
        if response.status_code == 200:
            data = response.json()
            print(data)
        else:
            print(f"Error: {response.status_code}, {response.text}")
    except Exception as err:
        print('Connection closed due to errors:', err)

def get_req_options():
    return {
        'method': 'POST',
        'headers': {
            'API': API_KEY,
            'Content-Type': 'application/json'
        }
    }

def fill(color, start, length):
    params = urlencode({'color': color, 'start': start, 'length': length})
    send_command('fill', params, get_req_options())

def gradient(start_color, end_color, start, length):
    params = urlencode({'startColor': start_color, 'endColor': end_color, 'start': start, 'length': length})
    send_command('gradient', params, get_req_options())

def set_pixel(location, color):
    params = urlencode({'location': location, 'color': color})
    send_command('setPixel', params, get_req_options())

def set_pixels(pixels):
    params = urlencode({'pixels': pixels})
    send_command('setPixels', params, get_req_options())

def say(text, color, bgcolor):
    params = urlencode({'text': text, 'textColor': color, 'backgroundColor': bgcolor})
    send_command('say', params, get_req_options())

def play_sound(sfx, bgm):
    params = urlencode({'sfx': sfx, 'bgm': bgm})
    send_command('playSound', params, get_req_options())

def get_sounds(sound_type):
    get_options = {
        'method': 'GET',
        'headers': {
            'API': API_KEY,
            'Content-Type': 'application/json'
        }
    }
    params = f"type={sound_type}"
    send_command('say', params, get_options)  # Assuming `say` was mistakenly reused

# Example usage
# login('http://localhost:3000', 'your-api-key')
# fill('#ff0000', 0, 10)
# say('Hello', 'white', 'black')
