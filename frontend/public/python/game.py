import js
import time

def move():
    js.window.move()

def getPosition():
    return js.window.getPosition()

def turnRight():
    js.window.turnRight()

def turnLeft():
    js.window.turnLeft()

def direction():
    return js.window.direction()

# works but freezes like while
def sleep(seconds):
    time.sleep(seconds)

# Die Brückenfunktion bleibt exakt gleich
def code_ausfuehren(code_string):
    try:
        exec(code_string, globals())
    except Exception as e:
        print(f"FEHLER BEI DER AUSFÜHRUNG: {e}")

print("Spiel-Bibliothek wurde geladen!")