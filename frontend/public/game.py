import js

# Wir benennen die alte Funktion um, damit sie zum neuen Code passt
def bewege_rechts():
  js.window.moveDrone('rechts')

def bewege_links():
  js.window.moveDrone('links')

# NEUE FUNKTIONEN für die Z-Achse
def bewege_hoch():
  js.window.moveDrone('hoch')

def bewege_runter():
  js.window.moveDrone('runter')

# Die Brückenfunktion bleibt exakt gleich
def code_ausfuehren(code_string):
    try:
        exec(code_string, globals())
    except Exception as e:
        print(f"FEHLER BEI DER AUSFÜHRUNG: {e}")

print("Spiel-Bibliothek wurde geladen!")