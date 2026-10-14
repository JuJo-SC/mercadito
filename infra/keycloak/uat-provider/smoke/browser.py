"""Browser authorization smoke against an isolated, disposable Keycloak realm."""
import base64
import html
import http.cookiejar
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://keycloak:8080"
REALM = BASE + "/realms/uat-smoke"


class InternalRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urllib.parse.urlsplit(newurl).hostname == "app.test":
            return None
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def opener():
    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()), InternalRedirects())


def opened(client, request):
    try:
        return client.open(request, timeout=20)
    except urllib.error.HTTPError as error:
        if error.code in (302, 303):
            return error
        raise


def authorization(client):
    query = urllib.parse.urlencode({"client_id": "uat-smoke", "response_type": "code", "scope": "openid",
                                  "redirect_uri": "http://app.test/callback", "state": "fixture-state", "nonce": "fixture-nonce"})
    result = opened(client, REALM + "/protocol/openid-connect/auth?" + query)
    return result.read().decode()


def authenticate(username, password="fixture-password"):
    client = opener()
    document = authorization(client)
    match = re.search(r'<form[^>]+action="([^"]+)"', document)
    assert match, "Missing UAT form"
    action = html.unescape(match.group(1))
    body = urllib.parse.urlencode({"username": username, "password": password, "verificationConsent": "yes"}).encode()
    result = opened(client, urllib.request.Request(action, body))
    return result


def token_response(code):
    data = urllib.parse.urlencode({"grant_type": "authorization_code", "client_id": "uat-smoke",
                                 "client_secret": "fixture-client-secret", "redirect_uri": "http://app.test/callback", "code": code}).encode()
    with urllib.request.urlopen(REALM + "/protocol/openid-connect/token", data, timeout=20) as result:
        return json.load(result)


def claims(token):
    chunk = token.split(".")[1]
    return json.loads(base64.urlsafe_b64decode(chunk + "=" * (-len(chunk) % 4)))


for attempt in range(90):
    try:
        urllib.request.urlopen(REALM + "/.well-known/openid-configuration", timeout=2).close()
        break
    except (OSError, urllib.error.HTTPError):
        time.sleep(1)
else:
    raise AssertionError("Disposable Keycloak did not become ready")

if sys.argv[1] == "closed":
    document = authorization(opener())
    assert "Acceso UAT en preparación" in document
    assert 'name="username"' not in document and 'name="password"' not in document
    print("PASS: closed gate renders no credential inputs")
else:
    admin_body = urllib.parse.urlencode({"grant_type": "password", "client_id": "admin-cli",
                                        "username": "fixture-admin", "password": "fixture-admin-password"}).encode()
    with urllib.request.urlopen(BASE + "/realms/master/protocol/openid-connect/token", admin_body, timeout=20) as result:
        admin_token = json.load(result)["access_token"]
    profile_endpoint = BASE + "/admin/realms/uat-smoke/users/profile"
    headers = {"Authorization": "Bearer " + admin_token, "Content-Type": "application/json"}
    with urllib.request.urlopen(urllib.request.Request(profile_endpoint, headers=headers), timeout=20) as result:
        profile = json.load(result)
    for attribute in profile["attributes"]:
        if attribute["name"] in ("email", "firstName", "lastName"):
            attribute["required"] = {"roles": ["user"], "scopes": ["email" if attribute["name"] == "email" else "profile"]}
    for name, size in (("mercadito_privacy_version", 80), ("mercadito_privacy_accepted_at", 64)):
        profile["attributes"].append({"name": name, "permissions": {"view": ["admin"], "edit": ["admin"]},
                                      "validations": {"length": {"max": size}}})
    request = urllib.request.Request(profile_endpoint, json.dumps(profile).encode(), headers=headers, method="PUT")
    urllib.request.urlopen(request, timeout=20).close()
    subjects = []
    for username in ("000123", "a000123@alumnos.uat.edu.mx"):
        result = authenticate(username)
        location = result.headers.get("Location", "")
        code = urllib.parse.parse_qs(urllib.parse.urlsplit(location).query).get("code", [None])[0]
        if not code:
            document = result.read().decode()
            labels = re.findall(r"<h[1-3][^>]*>(.*?)</h[1-3]>", document, re.S)
            fields = re.findall(r"name=[\'\"]([^\'\"]+)", document)
            raise AssertionError("Active fixture failed status=" + str(result.status) + " headings=" + repr(labels) + " fields=" + repr(fields) + " errors=" + repr(re.findall(r"uat[A-Za-z]+|No encontramos[^<]*|El portal[^<]*|La verificación[^<]*", document)))
        tokens = token_response(code)
        identity = claims(tokens["id_token"])
        assert identity["university_id"] == "uat"
        assert identity["uat_student_verified"] is True
        assert identity["uat_display_name"] == "María Isabel L."
        assert identity["uat_private_name"] == "María Isabel López García"
        assert "uat_private_name" not in claims(tokens["access_token"])
        assert "name" not in identity and "given_name" not in identity and "family_name" not in identity
        assert "preferred_username" not in identity and "email" not in identity
        assert "000123" not in json.dumps(identity)
        subjects.append(identity["sub"])
        with urllib.request.urlopen(urllib.request.Request(REALM + "/protocol/openid-connect/userinfo",
                                     headers={"Authorization": "Bearer " + tokens["access_token"]}), timeout=20) as response:
            userinfo = json.load(response)
            assert userinfo["sub"] == identity["sub"]
            assert userinfo["university_id"] == "uat" and userinfo["uat_student_verified"] is True
            assert userinfo["uat_display_name"] == "María Isabel L."
    assert subjects[0] == subjects[1], "Repeated portal login changed the OIDC subject"

    inactive = authenticate("000124").read().decode()
    invalid = authenticate("000125").read().decode()
    assert "El portal UAT indica baja, inactividad o egreso" in inactive
    assert "El portal UAT rechazó el acceso" in invalid

    admin_body = urllib.parse.urlencode({"grant_type": "password", "client_id": "admin-cli",
                                        "username": "fixture-admin", "password": "fixture-admin-password"}).encode()
    with urllib.request.urlopen(BASE + "/realms/master/protocol/openid-connect/token", admin_body, timeout=20) as result:
        admin_token = json.load(result)["access_token"]
    request = urllib.request.Request(BASE + "/admin/realms/uat-smoke/users", headers={"Authorization": "Bearer " + admin_token})
    with urllib.request.urlopen(request, timeout=20) as result:
        users = json.load(result)
    assert len(users) == 1 and users[0]["id"] == subjects[0]
    request = urllib.request.Request(BASE + "/admin/realms/uat-smoke/users/" + subjects[0] + "/credentials",
                                    headers={"Authorization": "Bearer " + admin_token})
    with urllib.request.urlopen(request, timeout=20) as result:
        assert json.load(result) == [], "Portal password was persisted as a Keycloak credential"
    attributes = users[0].get("attributes", {})
    assert set(attributes) == {"mercadito_privacy_version", "mercadito_privacy_accepted_at"}
    assert attributes["mercadito_privacy_version"] == ["provisional-2026-10-12"]
    assert attributes["mercadito_privacy_accepted_at"][0].endswith("Z")
    for _ in range(2):
        failure = authenticate("000123", "wrong-fixture-password").read().decode()
        assert "El portal UAT rechazó el acceso" in failure
        time.sleep(0.2)
    detection_url = BASE + "/admin/realms/uat-smoke/attack-detection/brute-force/users/" + subjects[0]
    with urllib.request.urlopen(urllib.request.Request(detection_url, headers={"Authorization": "Bearer " + admin_token}), timeout=20) as result:
        failures = json.load(result)
    assert failures.get("numFailures", 0) >= 2, "Failed portal passwords were not counted by Keycloak"
    assert failures.get("disabled") is True, "Native brute-force protection did not block the fixture account"
    blocked = authenticate("000123").read().decode()
    assert "El portal UAT rechazó el acceso" in blocked
    print("PASS: browser login, stable sub, ID token/userinfo claims, inactive/invalid rejection, no stored credential, native brute-force counters")
