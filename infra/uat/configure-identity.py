"""Dedicated UAT client: default read-only; --apply prepares only UAT resources."""
import argparse
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE = os.environ.get("KEYCLOAK_ADMIN_URL", "http://mercadito-keycloak:8080").rstrip("/")
REALM = "mercadito-uat"
CLIENT = "mercadito-uat-web"
FLOW = "mercadito-uat-browser"
PROVIDER = "mercadito-uat-authenticator"


def request(path, method="GET", body=None, token=None, form=None, allow_not_found=False):
    payload = urllib.parse.urlencode(form).encode() if form is not None else (
        json.dumps(body).encode() if body is not None else None
    )
    headers = {"Content-Type": "application/x-www-form-urlencoded" if form is not None else "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + path, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            return json.loads(data) if data else None
    except urllib.error.HTTPError as error:
        if allow_not_found and error.code == 404:
            return None
        raise RuntimeError(f"Keycloak rechazó {method} {path}: HTTP {error.code}") from None


def note_mapper(name, note, kind):
    return {
        "name": name, "protocol": "openid-connect",
        "protocolMapper": "oidc-usersessionmodel-note-mapper", "consentRequired": False,
        "config": {
            "user.session.note": note, "claim.name": note, "jsonType.label": kind,
            "id.token.claim": "true", "userinfo.token.claim": "true",
            "access.token.claim": "false",
        },
    }


def main():
    args = argparse.ArgumentParser()
    args.add_argument("--apply", action="store_true")
    options = args.parse_args()
    username = os.environ.get("KC_BOOTSTRAP_ADMIN_USERNAME") or os.environ.get("KEYCLOAK_ADMIN")
    password = os.environ.get("KC_BOOTSTRAP_ADMIN_PASSWORD") or os.environ.get("KEYCLOAK_ADMIN_PASSWORD")
    if not username or not password:
        raise RuntimeError("Falta el entorno administrativo externo de Keycloak.")
    token = request("/realms/master/protocol/openid-connect/token", method="POST", form={
        "client_id": "admin-cli", "grant_type": "password", "username": username, "password": password,
    })["access_token"]
    endpoint = "/admin/realms/" + REALM
    realm = request(endpoint, token=token, allow_not_found=True)
    if not realm and not options.apply:
        print(json.dumps({"realm": REALM, "realmExists": False, "changed": False}))
        return
    created_realm = realm is None
    if created_realm:
        request("/admin/realms", method="POST", token=token, body={
            "realm": REALM, "enabled": True, "sslRequired": "external",
            "registrationAllowed": False, "resetPasswordAllowed": False,
            "editUsernameAllowed": False, "verifyEmail": False,
            "loginTheme": "mercadito-uat", "bruteForceProtected": True,
            "failureFactor": 5, "waitIncrementSeconds": 60,
            "maxFailureWaitSeconds": 900, "permanentLockout": False,
            "attributes": {"mercaditoUatIntegration": "true"},
        })
        realm = request(endpoint, token=token)
    if realm.get("attributes", {}).get("mercaditoUatIntegration") != "true":
        raise RuntimeError("El realm UAT existente no pertenece a esta integración; revisar.")
    profile = request(endpoint + "/users/profile", token=token)
    expected_scopes = {"email": "email", "firstName": "profile", "lastName": "profile"}
    metadata = {"mercadito_privacy_version", "mercadito_privacy_accepted_at"}
    if created_realm:
        for attribute in profile["attributes"]:
            if attribute["name"] in expected_scopes:
                attribute["required"] = {"roles": ["user"], "scopes": [expected_scopes[attribute["name"]]]}
        for name in sorted(metadata):
            profile["attributes"].append({
                "name": name, "displayName": name,
                "permissions": {"view": ["admin"], "edit": ["admin"]},
            })
        request(endpoint + "/users/profile", method="PUT", token=token, body=profile)
    else:
        indexed = {attribute["name"]: attribute for attribute in profile.get("attributes", [])}
        for name, scope in expected_scopes.items():
            if indexed.get(name, {}).get("required") != {"roles": ["user"], "scopes": [scope]}:
                raise RuntimeError("El perfil UAT difiere en " + name + "; revisar sin sobrescribir.")
        for name in metadata:
            if indexed.get(name, {}).get("permissions") != {"view": ["admin"], "edit": ["admin"]}:
                raise RuntimeError("Permisos inesperados del atributo " + name + ".")
    if not realm.get("bruteForceProtected") or realm.get("registrationAllowed") or realm.get("resetPasswordAllowed"):
        raise RuntimeError("Los controles del realm UAT difieren; revisar sin sobrescribir.")
    flows = request(endpoint + "/authentication/flows", token=token)
    matches = [item for item in flows if item["alias"] == FLOW]
    clients = request(endpoint + "/clients?clientId=" + CLIENT, token=token)
    if not options.apply:
        print(json.dumps({"realm": REALM, "client": CLIENT, "flow": FLOW, "clientExists": bool(clients),
                          "flowExists": bool(matches), "changed": False}))
        return
    if not matches:
        request(endpoint + "/authentication/flows", method="POST", token=token, body={
            "alias": FLOW, "description": "Verificación privada UAT; requiere habilitación explícita.",
            "providerId": "basic-flow", "topLevel": True, "builtIn": False,
        })
        matches = [item for item in request(endpoint + "/authentication/flows", token=token) if item["alias"] == FLOW]
    flow = matches[0]
    executions_path = endpoint + "/authentication/flows/" + FLOW + "/executions"
    executions = request(executions_path, token=token)
    if any(item.get("providerId") != PROVIDER for item in executions):
        raise RuntimeError("El flujo UAT contiene ejecuciones inesperadas; revisar sin sobrescribir.")
    created_execution = not executions
    if created_execution:
        request(executions_path + "/execution", method="POST", token=token, body={"provider": PROVIDER})
        executions = request(executions_path, token=token)
    if len(executions) != 1:
        raise RuntimeError("Debe existir exactamente una ejecución UAT.")
    execution = executions[0]
    if not created_execution and execution.get("requirement") != "REQUIRED":
        raise RuntimeError("La ejecución UAT tiene un requisito inesperado; revisar.")
    execution["requirement"] = "REQUIRED"
    request(executions_path, method="PUT", token=token, body=execution)
    config = {
        "clientId": CLIENT, "name": "Mercadito · UAT",
        "protocol": "openid-connect", "enabled": True, "publicClient": False,
        "standardFlowEnabled": True, "directAccessGrantsEnabled": False,
        "serviceAccountsEnabled": False,
        "redirectUris": ["https://mercadito.291006.xyz/api/auth/callback/keycloak"],
        "webOrigins": ["https://mercadito.291006.xyz"],
        "defaultClientScopes": [], "optionalClientScopes": [],
        "attributes": {"pkce.code.challenge.method": "S256", "login_theme": "mercadito-uat"},
        "authenticationFlowBindingOverrides": {"browser": flow["id"]},
        "protocolMappers": [
            note_mapper("uat-university-session", "university_id", "String"),
            note_mapper("uat-student-session", "uat_student_verified", "boolean"),
            note_mapper("uat-display-name-session", "uat_display_name", "String"),
        ],
    }
    if clients:
        client = request(endpoint + "/clients/" + clients[0]["id"], token=token)
        for name in ("enabled", "protocol", "publicClient", "standardFlowEnabled",
                     "directAccessGrantsEnabled", "serviceAccountsEnabled",
                     "redirectUris", "webOrigins", "authenticationFlowBindingOverrides"):
            if client.get(name) != config[name]:
                raise RuntimeError("El cliente UAT difiere en " + name + "; revisar sin sobrescribir.")
        if client.get("defaultClientScopes") or client.get("optionalClientScopes"):
            raise RuntimeError("El cliente UAT heredó scopes; revisar antes de propagar datos.")
        for name, value in config["attributes"].items():
            if client.get("attributes", {}).get(name) != value:
                raise RuntimeError("El cliente UAT difiere en " + name + ".")
        expected = {(mapper["name"], mapper["protocolMapper"]): mapper["config"] for mapper in config["protocolMappers"]}
        actual = {(mapper["name"], mapper["protocolMapper"]): mapper["config"] for mapper in client.get("protocolMappers", [])}
        name_key = ("uat-display-name-session", "oidc-usersessionmodel-note-mapper")
        if actual == {key: value for key, value in expected.items() if key != name_key}:
            request(endpoint + "/clients/" + client["id"] + "/protocol-mappers/models",
                    method="POST", token=token, body=config["protocolMappers"][-1])
        elif actual != expected:
            raise RuntimeError("Los mappers UAT difieren; revisar sin sobrescribir.")
    else:
        request(endpoint + "/clients", method="POST", token=token, body=config)
        client = request(endpoint + "/clients?clientId=" + CLIENT, token=token)[0]
    secret = request(endpoint + "/clients/" + client["id"] + "/client-secret", token=token)["value"]
    path = Path("/secrets/uat-auth.env")
    if path.exists():
        existing = {}
        for line in path.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                name, value = line.split("=", 1)
                existing[name] = value
        for name, expected in {
            "AUTH_KEYCLOAK_ID": CLIENT,
            "AUTH_KEYCLOAK_SECRET": secret,
            "AUTH_KEYCLOAK_ISSUER": "https://auth.291006.xyz/realms/" + REALM,
        }.items():
            if existing.get(name) != expected:
                raise RuntimeError("El archivo de entorno existente difiere en " + name + "; revisar sin sobrescribir.")
    else:
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w") as stream:
            stream.write(
                "AUTH_KEYCLOAK_ID=" + CLIENT + "\nAUTH_KEYCLOAK_SECRET=" + secret +
                "\nAUTH_KEYCLOAK_ISSUER=https://auth.291006.xyz/realms/" + REALM +
                "\nACTIVE_UNIVERSITY_SLUG=uat\nACTIVE_UNIVERSITY_NAME=UAT"
                "\nUAT_LOGIN_ENABLED=false\nUAT_PRIVACY_URL=\n"
            )
    print(json.dumps({"realm": REALM, "client": CLIENT, "flow": FLOW, "prepared": True,
                      "umanClientUnchanged": True, "realLoginEnabled": False}))


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, KeyError, urllib.error.URLError) as error:
        raise SystemExit(str(error)) from None
