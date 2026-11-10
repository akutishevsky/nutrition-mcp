#!/usr/bin/env python3
"""ASC probe (IOS-PREP, Amendment H): report-only check for the Munch
App Store Connect app record and bundle ID.

Uses the same ES256 JWT machinery as the distribution leg of
.github/workflows/mobile-ios.yml (openssl + Python stdlib only — no
fastlane, no pip installs): builds a token from the ASC API key, then

  GET /v1/apps?filter[bundleId]=business.munch.app
  GET /v1/bundleIds?filter[identifier]=business.munch.app

and prints whether each exists. It creates, modifies, and deletes
NOTHING in App Store Connect.

Environment:
  ASC_KEY_ID          App Store Connect API key ID
  ASC_ISSUER_ID       App Store Connect API issuer ID
  ASC_PRIVATE_KEY_PATH  path to the AuthKey_<KEY_ID>.p8 file

Exit codes: 0 = probe ran (verdict printed, whether records exist or
not); 1 = missing configuration or the ASC API call failed.
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
        print(f"::error::ASC probe cannot run: missing {', '.join(missing)}.")
        return 1
    key_path = pathlib.Path(key_path_raw)
    if not key_path.is_file():
        print(f"::error::ASC probe cannot run: no .p8 file at {key_path}.")
        return 1

    work = pathlib.Path(os.environ.get("RUNNER_TEMP", "/tmp")) / "munch-asc-probe"
    work.mkdir(parents=True, exist_ok=True)
    token = build_token(key_id, issuer_id, key_path, work)
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def call(path: str):
        request = urllib.request.Request(API + path, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                body = response.read()
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as error:
            print(f"::error::ASC API GET {path} failed ({error.code}): {error.read().decode()[:600]}")
            raise SystemExit(1)

    apps_query = urllib.parse.urlencode({"filter[bundleId]": BUNDLE_ID, "limit": "200"})
    apps = call(f"/apps?{apps_query}").get("data", [])
    exact_apps = [a for a in apps if a.get("attributes", {}).get("bundleId") == BUNDLE_ID]

    bundle_query = urllib.parse.urlencode({"filter[identifier]": BUNDLE_ID, "limit": "200"})
    bundles = call(f"/bundleIds?{bundle_query}").get("data", [])
    exact_bundles = [b for b in bundles if b.get("attributes", {}).get("identifier") == BUNDLE_ID]

    print(f"ASC probe for bundle ID {BUNDLE_ID} (report-only; nothing created):")
    if exact_bundles:
        record = exact_bundles[0]
        attrs = record.get("attributes", {})
        print(f"  bundle ID record: EXISTS — id={record.get('id')} name={attrs.get('name')} platform={attrs.get('platform')}")
    else:
        print("  bundle ID record: MISSING — no bundleIds record with this identifier.")
    if exact_apps:
        record = exact_apps[0]
        attrs = record.get("attributes", {})
        print(f"  app record:       EXISTS — id={record.get('id')} name={attrs.get('name')} sku={attrs.get('sku')}")
    else:
        print("  app record:       MISSING — no apps record with this bundle ID.")
    print(f"  verdict: app={'present' if exact_apps else 'absent'}, bundleId={'present' if exact_bundles else 'absent'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
