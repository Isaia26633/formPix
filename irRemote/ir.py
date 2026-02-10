import RPi.GPIO as GPIO
from datetime import datetime
import time

class IRListener():
    def __init__(self):
        self.pin = 27
        self.buttons = {
            'power': 0xffa25d,
            'vol_up': 0xff629d,
            'func': 0xffe21d,
            'rewind': 0xff22dd,
            'play_pause': 0xff02fd,
            'forward': 0xffc23d,
            'down': 0xffe01f,
            'vol_down': 0xffa857,
            'up': 0xff906f,
            '0': 0xff6897,
            'eq': 0xff9867,
            'repeat': 0xffb04f,
            '1': 0xff30cf,
            '2': 0xff18e7,
            '3': 0xff7a85,
            '4': 0xff10ef,
            '5': 0xff38c7,
            '6': 0xff5aa5,
            '7': 0xff42bd,
            '8': 0xff4ab5,
            '9': 0xff52ad
        }

pin = 27
GPIO.setmode(GPIO.BCM)
GPIO.setup(pin, GPIO.IN)

def getBinary():
    """Wait for IR signal and return binary value"""
    timeout = time.time() + 1
    while GPIO.input(pin) and time.time() < timeout:
        time.sleep(0.001)
    
    if time.time() >= timeout:
        return None
    
    pulses = []
    start_time = time.time()
    
    while time.time() - start_time < 0.2:
        if GPIO.input(pin) == 1:
            high_start = time.time()
            while GPIO.input(pin) == 1 and time.time() - start_time < 0.2:
                time.sleep(0.00001)
            high_duration = int((time.time() - high_start) * 1000000)
            if high_duration > 100:
                pulses.append(high_duration)
        time.sleep(0.00001)
    
    # Skip first pulse (leader) and last 2 pulses (repeat/trail)
    if len(pulses) < 33:
        return None
    
    data_pulses = pulses[1:33]  # Get only the 32 data bits
    
    binary = ""
    for pulse in data_pulses:
        if pulse > 1000:
            binary += "1"
        else:
            binary += "0"
    
    if binary and len(binary) == 32:
        try:
            result = int(binary, 2)
            return result
        except:
            return None
    
    return None

def convertHex(binaryValue):
    """Convert integer to hexadecimal"""
    if binaryValue is None:
        return None
    return hex(binaryValue)
