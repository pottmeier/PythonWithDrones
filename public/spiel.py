# public/spiel.py

import js

# Diese Funktionen bleiben unverändert
def bewege_rechts():
  print("Python: bewege_rechts() wurde aufgerufen.")
  js.window.moveBox('rechts')

def bewege_links():
    print("Python: bewege_links() wurde aufgerufen.")
    js.window.moveBox('links')

# ===================================================================
# NEUE FUNKTION: Unser "Motor" für die Code-Ausführung
# Sie nimmt einen String entgegen und führt ihn als Python-Code aus.
def code_ausfuehren(code_string):
    try:
        # globals() sorgt dafür, dass der Code Zugriff auf alle
        # anderen Funktionen wie 'bewege_rechts' hat.
        exec(code_string, globals())
    except Exception as e:
        print(f"FEHLER BEI DER AUSFÜHRUNG: {e}")
# ===================================================================

print("Spiel-Bibliothek wurde geladen!")