import time
import socketio
import ir
import threading
import config

# Create a Socket.IO client instance
sio = socketio.Client()

# Define connection event handler
@sio.event
def connect():
    print("Connected to the server!")
    sio.emit('getActiveClass')

@sio.event
def setClass(data):
   print("Got class", data)

@sio.event
def disconnect():
    print("Disconnected from the server!")

@sio.event
def startPoll():
    print("Poll started on server")

@sio.event
def message(data):
    print(f"Server message: {data}")

@sio.event
def error(data):
    print(f"Server error: {data}")


def ir_loop_process():
    """Run in separate thread to avoid blocking main thread"""
    try:
        listener = ir.IRListener()
        last_code = None
        last_press_time = 0
        
        while True:
            binary_signal = ir.getBinary()
            if binary_signal is None:
                time.sleep(0.05)
                continue
            
            hex_signal = ir.convertHex(binary_signal)
            
            # Debounce: ignore same button pressed within 200ms
            current_time = time.time()
            if hex_signal == last_code and current_time - last_press_time < 0.2:
                time.sleep(0.05)
                continue
            
            last_code = hex_signal
            last_press_time = current_time
            
            for name, code in listener.buttons.items():
                if hex_signal == hex(code):
                    print(f"Button pressed: {name}")
                    
                    if name == "1":
                        sio.emit('startPoll', (0, 0, "Done/Ready", [{"answer":"Done/ready?","weight":1,"color":"#00ff00"}], False, 1, [], [], [], [], False, True))
                    elif name == "2":
                        sio.emit('startPoll', (0, 0, "True/False", [{"answer":"True","weight":1,"color":"#00ff00"}, {"answer":"False","weight":1,"color":"#ff0000"}], False, 1, [], [], [], [], False, True))
                    elif name == "3":
                        sio.emit('startPoll', (0, 0, "TUTD", [{"answer":"Up","weight":1,"color":"#00ff00"}, {"answer":"Wiggle","weight":1,"color":"#00ffff"}, {"answer":"Down","weight":1,"color":"#ff0000"}], False, 1, [], [], [], [], False, True))
                    elif name == "4":
                        sio.emit('startPoll', (0, 0, "Multiple Choice", [{"answer":"A","weight":1,"color":"#ff0000"}, {"answer":"B","weight":1,"color":"#00ff00"}, {"answer":"C","weight":1,"color":"#ffff00"}, {"answer":"D","weight":1,"color":"#0000ff"}], False, 1, [], [], [], [], False, True))
                    elif name == "5":
                        sio.emit('startPoll', (0, 1, "Essay", [{"answer":"Submit Text","weight":1,"color":"#ff0000"}], False, 1, [], [], [], [], False, True))
                    elif name == "play_pause":
                        sio.emit('updatePoll', {})
                    break
            
            time.sleep(0.05)
    
    except KeyboardInterrupt:
        print("IR process exiting...")


# Get teacher API key
extra_headers = {
    "api": config.api
}

# Connect to formbar URL
sio.connect(config.formbar, headers=extra_headers)

# Start IR listener in daemon thread
ir_thread = threading.Thread(target=ir_loop_process, daemon=True)
ir_thread.start()

# Keep the client running to listen for events
try:
    sio.wait()
except KeyboardInterrupt:
    print("Main process exiting...")
    sio.disconnect()
