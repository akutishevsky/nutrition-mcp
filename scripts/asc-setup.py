#!/usr/bin/env python3
"""ASC setup (IOS-BUILD, Amendment H + Rulings addendum 2): create the
Munch bundle ID record in App Store Connect via the ASC API, then
attempt the app record through the same API.

Ruling (Michael, 2026-11-10): creation is attempted through CI's ASC
JWT machinery first; Michael's console is used only if Apple refuses
the API path. This script is that attempt, and its printed verdict is
the record of which path created what:

  - Bundle ID: POST /v1/bundleIds is a documented, supported create.
  - App record: POST /v1/apps is attempted with the full create
    payload. Apple's API has historically refused app-record creation
    (the console is the only path); whatever Apple answers is printed
    verbatim so the refusal — if that is the outcome — is on record
    with its exact error, and the console step is named precisely.

Idempotent: existing records are reported, never re-created.

Uses the same ES256 JWT machinery as scripts/asc-probe.py (openssl +
Python stdlib only — no fastlane, no pip installs).

Environment:
  ASC_KEY_ID          App Store Connect API key ID
  ASC_ISSUER_ID       App Store Connect API issuer ID
  ASC_PRIVATE_KEY_PATH  path to the AuthKey_<KEY_ID>.p8 file

Exit codes: 0 = both records exist at the end (created or already
present); 2 = bundle ID exists but the app record could not be created
via the API (console step required — see the printed verdict);
1 = missing configuration or an unexpected API failure.
"""

import base64
import json
import os
import pathlib
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BUNDLE_ID = "business.munch.app"
APP_NAME = "Munch"
APP_SKU = "business.munch.app"
PRIMARY_LOCALE = "en-US"
API = "https://api.appstoreconnect.apple.com/v1"


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def build_token(key_id: str, issuer_id: str, key_path: pathlib.Path, work: pathlib.Path) -> str:
    now = int(time.time())
    header = b64url(json.dumps({"alg": "ES256", "kid": key_id, "typ": "JWT"}, separators=(",", ":")).encode())
    payload = b64url(
        json.dumps(
            {"iss": issuer_id, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
            separators=(",", ":"),
        ).encode()
    )
    signing_input = work / "jwt-input.bin"
    signing_input.write_bytes(f"{header}.{payload}".encode())
    subprocess.run(
        ["openssl", "dgst", "-sha256", "-sign", str(key_path), "-out", str(work / "jwt-sig.der"), str(signing_input)],
        check=True,
    )
    der = (work / "jwt-sig.der").read_bytes()
    idx = 2 + (der[1] & 0x7F) if der[1] & 0x80 else 2

    def read_int(buf: bytes, i: int):
        length = buf[i + 1]
        value = buf[i + 2 : i + 2 + length].lstrip(b"\x00").rjust(32, b"\x00")
        return value, i + 2 + length

    r, idx = read_int(der, idx)
    s, _ = read_int(der, idx)
    return f"{header}.{payload}.{b64url(r + s)}"


class Api:
    def __init__(self, token: str):
        self.headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def call(self, method: str, path: str, payload: dict | None = None):
        """Returns (status, parsed_body). HTTP errors are returned, not raised."""
        data = json.dumps(payload).encode() if payload is not None else None
        request = urllib.request.Request(API + path, data=data, headers=self.headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                body = response.read()
                return response.status, (json.loads(body) if body else {})
        except urllib.error.HTTPError as error:
            body = error.read().decode()
            try:
                parsed = json.loads(body) if body else {}
            except json.JSONDecodeError:
                parsed = {"raw": body[:600]}
            return error.code, parsed


def find_bundle(api: Api):
    query = urllib.parse.urlencode({"filter[identifier]": BUNDLE_ID, "limit": "200"})
    status, body = api.call("GET", f"/bundleIds?{query}")
    if status != 200:
        print(f"::error::ASC API GET /bundleIds failed ({status}): {json.dumps(body)[:600]}")
        raise SystemExit(1)
    exact = [b for b in body.get("data", []) if b.get("attributes", {}).get("identifier") == BUNDLE_ID]
    return exact[0] if exact else None


def find_app(api: Api):
    query = urllib.parse.urlencode({"filter[bundleId]": BUNDLE_ID, "limit": "200"})
    status, body = api.call("GET", f"/apps?{query}")
    if status != 200:
        print(f"::error::ASC API GET /apps failed ({status}): {json.dumps(body)[:600]}")
        raise SystemExit(1)
    exact = [a for a in body.get("data", []) if a.get("attributes", {}).get("bundleId") == BUNDLE_ID]
    return exact[0] if exact else None


def main() -> int:
    key_id = os.environ.get("ASC_KEY_ID", "")
    issuer_id = os.environ.get("ASC_ISSUER_ID", "")
    key_path_raw = os.environ.get("ASC_PRIVATE_KEY_PATH", "")
    missing = [
        name
        for name, value in (
            ("ASC_KEY_ID", key_id),
            ("ASC_ISSUER_ID", issuer_id),
            ("ASC_PRIVATE_KEY_PATH", key_path_raw),
        )
        if not value
    ]
    if missing:
        print(f"::error::ASC setup cannot run: missing {', '.join(missing)}.")
        return 1
    key_path = pathlib.Path(key_path_raw)
    if not key_path.is_file():
        print(f"::error::ASC setup cannot run: no .p8 file at {key_path}.")
        return 1

    work = pathlib.Path(os.environ.get("RUNNER_TEMP", "/tmp")) / "munch-asc-setup"
    work.mkdir(parents=True, exist_ok=True)
    api = Api(build_token(key_id, issuer_id, key_path, work))

    print(f"ASC setup for bundle ID {BUNDLE_ID} (Rulings addendum 2: API first, console only on refusal):")

    bundle = find_bundle(api)
    if bundle:
        attrs = bundle.get("attributes", {})
        print(f"  bundle ID record: EXISTS — id={bundle.get('id')} name={attrs.get('name')} platform={attrs.get('platform')}")
    else:
        status, body = api.call(
            "POST",
            "/bundleIds",
            {
                "data": {
                    "type": "bundleIds",
                    "attributes": {"identifier": BUNDLE_ID, "name": APP_NAME, "platform": "IOS"},
                }
            },
        )
        if status in (200, 201) and body.get("data"):
            bundle = body["data"]
            attrs = bundle.get("attributes", {})
            print(f"  bundle ID record: CREATED via API — id={bundle.get('id')} name={attrs.get('name')} platform={attrs.get('platform')}")
        else:
            print(f"::error::ASC API POST /bundleIds failed ({status}): {json.dumps(body)[:600]}")
            print("  verdict: bundleId=failed, app=not-attempted")
            return 1

    app = find_app(api)
    if app:
        attrs = app.get("attributes", {})
        print(f"  app record:       EXISTS — id={app.get('id')} name={attrs.get('name')} sku={attrs.get('sku')}")
        print("  verdict: app=present, bundleId=present — nothing left for the console.")
        return 0

    status, body = api.call(
        "POST",
        "/apps",
        {
            "data": {
                "type": "apps",
                "attributes": {
                    "name": APP_NAME,
                    "primaryLocale": PRIMARY_LOCALE,
                    "sku": APP_SKU,
                },
                "relationships": {
                    "bundleId": {"data": {"type": "bundleIds", "id": bundle.get("id")}},
                },
            }
        },
    )
    if status in (200, 201) and body.get("data"):
        record = body["data"]
        attrs = record.get("attributes", {})
        print(f"  app record:       CREATED via API — id={record.get('id')} name={attrs.get('name')} sku={attrs.get('sku')}")
        print("  verdict: app=created-via-api, bundleId=present — nothing left for the console.")
        return 0

    print(f"  app record:       API CREATION REFUSED ({status}): {json.dumps(body)[:600]}")
    print(
        "::error::The ASC API refused app-record creation. Remaining step is Michael's console: "
        "App Store Connect → My Apps → + → New App — platform iOS, name Munch, primary language "
        f"English (US), bundle ID {BUNDLE_ID} (now registered), SKU {APP_SKU}."
    )
    print("  verdict: app=refused-via-api, bundleId=present — console step required (one screen).")
    return 2


if __name__ == "__main__":
    sys.exit(main())
