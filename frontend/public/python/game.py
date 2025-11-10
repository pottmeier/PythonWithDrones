import js

# Wir benennen die alte Funktion um, damit sie zum neuen Code passt
def move(direction:str):
    js.window.moveDrone(direction)

# Die Brückenfunktion bleibt exakt gleich
def code_ausfuehren(code_string):
    try:
        exec(code_string, globals())
    except Exception as e:
        print(f"FEHLER BEI DER AUSFÜHRUNG: {e}")

print("Spiel-Bibliothek wurde geladen!")