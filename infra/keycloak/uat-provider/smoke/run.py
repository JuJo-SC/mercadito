"""Run only on Oracle: temporary containers, tmpfs database, no host ports or production secrets."""
import json
import pathlib
import subprocess
import tempfile
import uuid

SOURCE = pathlib.Path(__file__).resolve().parent
IMAGE = "mercadito-keycloak:uat-candidate"
PREFIX = "mercadito-uat-smoke-" + uuid.uuid4().hex[:10]
NETWORK = PREFIX + "-network"
CONTAINERS = []


def docker(*args, capture=False):
    result = subprocess.run(["docker", *args], check=True, capture_output=capture, text=True)
    return result.stdout.strip() if capture else None


def start(name, *args):
    assert name.startswith(PREFIX + "-")
    docker("run", "-d", "--name", name, "--network", NETWORK, *args, capture=True)
    CONTAINERS.append(name)


def mapper(name, note, data_type):
    return {"name": name, "protocol": "openid-connect", "protocolMapper": "oidc-usersessionmodel-note-mapper",
            "config": {"user.session.note": note, "claim.name": note, "jsonType.label": data_type,
                       "id.token.claim": "true", "access.token.claim": "true", "userinfo.token.claim": "true"}}


with tempfile.TemporaryDirectory(prefix=PREFIX + "-") as temporary:
    root = pathlib.Path(temporary)
    root.chmod(0o755)
    realm = {"realm": "uat-smoke", "enabled": True,
             "registrationAllowed": False, "resetPasswordAllowed": False,
             "bruteForceProtected": True, "failureFactor": 2, "waitIncrementSeconds": 60,
             "minimumQuickLoginWaitSeconds": 1, "quickLoginCheckMilliSeconds": 0, "maxFailureWaitSeconds": 60,
             "authenticationFlows": [{"alias": "uat-browser-specific", "providerId": "basic-flow", "topLevel": True,
                                      "builtIn": False, "authenticationExecutions": [
                                          {"authenticator": "mercadito-uat-authenticator", "authenticatorFlow": False,
                                           "requirement": "REQUIRED", "priority": 0, "userSetupAllowed": False}]}],
             "browserFlow": "uat-browser-specific",
             "clients": [{"clientId": "uat-smoke", "enabled": True, "protocol": "openid-connect", "publicClient": False,
                          "secret": "fixture-client-secret", "attributes": {"login_theme": "mercadito-uat"}, "standardFlowEnabled": True, "directAccessGrantsEnabled": False,
                          "redirectUris": ["http://app.test/callback"], "defaultClientScopes": [], "optionalClientScopes": [],
                          "protocolMappers": [mapper("uat-university", "university_id", "String"),
                                              mapper("uat-student", "uat_student_verified", "boolean")]}]}
    realm_file = root / "realm.json"
    realm_file.write_text(json.dumps(realm), encoding="utf-8")
    try:
        docker("network", "create", NETWORK, capture=True)
        start(PREFIX + "-database", "--network-alias", "database", "--tmpfs", "/var/lib/postgresql/data",
              "-e", "POSTGRES_USER=uat_smoke", "-e", "POSTGRES_PASSWORD=fixture-database-password",
              "-e", "POSTGRES_DB=uat_smoke", "postgres:17-alpine")
        start(PREFIX + "-gateway", "--network-alias", "gateway", "-v", str(SOURCE) + ":/fixture:ro",
              "python:3.13-alpine", "python", "/fixture/gateway.py")
        for mode in ("closed", "enabled"):
            name = PREFIX + "-keycloak-" + mode
            start(name, "--network-alias", "keycloak", "--tmpfs", "/opt/keycloak/data:uid=1000,gid=0",
                  "-v", str(realm_file) + ":/opt/keycloak/data/import/realm.json:ro",
                  "-e", "KC_DB_URL=jdbc:postgresql://database:5432/uat_smoke",
                  "-e", "KC_DB_USERNAME=uat_smoke", "-e", "KC_DB_PASSWORD=fixture-database-password",
                  "-e", "KC_BOOTSTRAP_ADMIN_USERNAME=fixture-admin", "-e", "KC_BOOTSTRAP_ADMIN_PASSWORD=fixture-admin-password",
                  "-e", "UAT_GATEWAY_URL=http://gateway:3100", "-e", "UAT_GATEWAY_API_KEY=fixture-key",
                  "-e", "UAT_LOGIN_ENABLED=" + ("true" if mode == "enabled" else "false"),
                  "-e", "UAT_PRIVACY_URL=https://example.test/privacy",
                  IMAGE, "start", "--optimized", "--import-realm", "--http-enabled=true",
                  "--hostname=http://keycloak:8080", "--hostname-strict=false", "--cache=local")
            try:
                docker("run", "--rm", "--network", NETWORK, "-v", str(SOURCE) + ":/fixture:ro",
                       "python:3.13-alpine", "python", "/fixture/browser.py", mode)
            except subprocess.CalledProcessError:
                # This is an isolated fixture; logs contain no production secrets or real pupils.
                docker("logs", "--tail", "100", name)
                raise
            finally:
                docker("rm", "-f", name, capture=True)
                CONTAINERS.remove(name)
        print("All isolated UAT smoke checks passed.")
    finally:
        for name in reversed(CONTAINERS):
            assert name.startswith(PREFIX + "-")
            subprocess.run(["docker", "rm", "-f", name], check=False, capture_output=True)
        subprocess.run(["docker", "network", "rm", NETWORK], check=False, capture_output=True)
