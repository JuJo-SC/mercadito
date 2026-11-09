"""Deterministic portal fixture. Never deploy this gateway to a production network."""
import json
import re
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))))
        expected = {"programPage": True, "schedule": False, "partialGrades": False, "finalGrades": False}
        assert self.path == "/api/v1/alumnos/scrape"
        assert self.headers.get("X-API-Key") == "fixture-key"
        assert body["include"] == expected and set(body) == {"username", "password", "include"}
        assert re.fullmatch(r"a[0-9]+@alumnos\.uat\.edu\.mx", body["username"])
        username = body["username"].split("@", 1)[0].removeprefix("a")
        if username == "000125" or body["password"] != "fixture-password":
            status, payload = 401, {"error": "UAT_LOGIN_FAILED"}
        else:
            status = 200
            payload = {"source": "UAT", "authenticated": True, "login": {"exito": True, "cambiaPass": False},
                       "programs": [{"raw": {"Num_Matricula": username, "Txt_DES": "Facultad de Ingeniería", "Txt_Nombre": "MARÍA ISABEL", "Txt_Apellido_Paterno": "LÓPEZ", "Txt_Apellido_Materno": "GARCÍA", "Situacion": "regulares" if username == "000123" else "INACTIVO"}}]}
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


HTTPServer(("0.0.0.0", 3100), Handler).serve_forever()
