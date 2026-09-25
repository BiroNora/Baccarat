import sys
import os

# Hozzáadjuk a gyökeret a python path-hez, hogy megtalálja a backendet/modulokat
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, project_root)

# Importáljuk a Flask appodat (igazítsd be az útvonalat ahová mentetted az app.py-t, pl. my_app.backend.app)
from my_app.backend.app import app

# A Vercel ezt a változót fogja keresni és futtatni
app = app
