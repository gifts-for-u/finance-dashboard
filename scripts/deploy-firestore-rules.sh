#!/usr/bin/env bash
# Deploy Firestore Security Rules via Google Cloud REST API.
#
# Alasan pakai REST API (bukan `firebase deploy --only firestore:rules`):
#   firebase CLI butuh permission 'serviceusage.services.get' untuk cek
#   apakah Firestore API sudah enabled. Service account standar Firebase
#   Hosting Admin + Rules Admin tidak punya permission ini, sehingga
#   step deploy sebelumnya gagal dengan:
#     Error: 403 Permission denied to get service [firestore.googleapis.com]
#
# Solusi: bypass firebase CLI, langsung ke Cloud Firestore Rules REST API
# (firebaserules.googleapis.com). Service account yang sudah punya
# roles/firebaserules.admin cukup untuk:
#   1. Create ruleset (POST projects/{id}/rulesets)
#   2. Release ruleset (PATCH projects/{id}/releases/cloud.firestore)
#
# Workflow setup (di .github/workflows/firebase-hosting.yml):
#   - google-github-actions/auth@v2 dengan service account JSON
#   - google-github-actions/setup-gcloud@v2 untuk install gcloud
#   - run script ini (gcloud sudah tersedia dari setup-gcloud)
#
# Required env:
#   FIREBASE_PROJECT_ID            : project ID (e.g. finance-dashboard-10nfl)
#   FIREBASE_RULES_FILE            : path to firestore.rules (default: ./firestore.rules)
#   DEBUG                          : set ke '1' untuk verbose logging
#
# Required IAM role untuk service account:
#   roles/firebaserules.admin (atau roles/firebase.admin)

# Note: tidak pakai 'set -e' di top level karena kita ingin handle
# error per-step secara eksplisit dengan pesan yang informatif.

# --- Input validation ---
: "${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID is required}"
: "${FIREBASE_RULES_FILE:=./firestore.rules}"
DEBUG="${DEBUG:-0}"

debug() {
  if [ "$DEBUG" = "1" ]; then
    echo "[DEBUG] $*" >&2
  fi
}

if [ ! -f "$FIREBASE_RULES_FILE" ]; then
  echo "ERROR: Rules file not found: $FIREBASE_RULES_FILE" >&2
  exit 1
fi

echo "=== Deploy Firestore Rules via REST API ==="
echo "Project:  $FIREBASE_PROJECT_ID"
echo "Rules:    $FIREBASE_RULES_FILE"
echo

# --- Get access token from gcloud (auth via google-github-actions) ---
echo "→ Fetching access token via gcloud..."
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null) || {
  echo "ERROR: gcloud auth print-access-token failed." >&2
  echo "Pastikan google-github-actions/auth@v2 sudah jalan sebelumnya," >&2
  echo "dan GOOGLE_APPLICATION_CREDENTIALS menunjuk ke service account JSON valid." >&2
  exit 1
}

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Empty access token from gcloud." >&2
  exit 1
fi
debug "Access token length: ${#ACCESS_TOKEN}"

# --- Step 1: Read rules file & base64-encode (per REST API spec) ---
echo "→ Reading & base64-encoding rules file..."
RULES_B64=$(base64 -w 0 "$FIREBASE_RULES_FILE")
debug "Rules file size: $(wc -c < "$FIREBASE_RULES_FILE") bytes, base64 length: ${#RULES_B64}"

# Build ruleset payload (use python to safely build JSON)
RULESET_PAYLOAD=$(python3 -c "
import base64, json, sys
with open('$FIREBASE_RULES_FILE', 'r') as f:
    content = f.read()
b64 = base64.b64encode(content.encode('utf-8')).decode('ascii')
payload = {
    'source': {
        'files': [
            {'name': 'firestore.rules', 'content': b64}
        ]
    }
}
print(json.dumps(payload))
")
debug "Payload size: ${#RULESET_PAYLOAD} bytes"

# --- Step 2: Create ruleset ---
echo "→ Creating ruleset..."
HTTP_RESPONSE=$(mktemp)
HTTP_CODE=$(curl -sS -o "$HTTP_RESPONSE" -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$RULESET_PAYLOAD" \
  "https://firebaserules.googleapis.com/v1/projects/$FIREBASE_PROJECT_ID/rulesets") || {
  echo "ERROR: curl failed to POST to firebaserules API" >&2
  cat "$HTTP_RESPONSE" >&2 || true
  rm -f "$HTTP_RESPONSE"
  exit 1
}

CREATE_RESPONSE=$(cat "$HTTP_RESPONSE")
rm -f "$HTTP_RESPONSE"

debug "HTTP status: $HTTP_CODE"
debug "Response: $CREATE_RESPONSE"

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: Failed to create ruleset (HTTP $HTTP_CODE). Response:" >&2
  echo "$CREATE_RESPONSE" >&2
  exit 1
fi

# Parse response JSON dengan python (lebih reliable dari grep)
RULESET_NAME=$(echo "$CREATE_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('name', ''))
")

if [ -z "$RULESET_NAME" ]; then
  echo "ERROR: No 'name' field in create response." >&2
  echo "Response was: $CREATE_RESPONSE" >&2
  exit 1
fi
echo "  ✓ Created: $RULESET_NAME"

# --- Step 3: Release ruleset ---
echo "→ Releasing ruleset to cloud.firestore..."
RELEASE_PAYLOAD=$(python3 -c "
import json
print(json.dumps({'rulesetName': '$RULESET_NAME'}))
")
debug "Release payload: $RELEASE_PAYLOAD"

HTTP_RESPONSE=$(mktemp)
HTTP_CODE=$(curl -sS -o "$HTTP_RESPONSE" -w "%{http_code}" -X PATCH \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$RELEASE_PAYLOAD" \
  "https://firebaserules.googleapis.com/v1/projects/$FIREBASE_PROJECT_ID/releases/cloud.firestore") || {
  echo "ERROR: curl failed to PATCH release" >&2
  cat "$HTTP_RESPONSE" >&2 || true
  rm -f "$HTTP_RESPONSE"
  exit 1
}

RELEASE_RESPONSE=$(cat "$HTTP_RESPONSE")
rm -f "$HTTP_RESPONSE"

debug "Release HTTP status: $HTTP_CODE"
debug "Release response: $RELEASE_RESPONSE"

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: Failed to release ruleset (HTTP $HTTP_CODE). Response:" >&2
  echo "$RELEASE_RESPONSE" >&2
  exit 1
fi

RELEASE_NAME=$(echo "$RELEASE_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('name', ''))
")

if [ -z "$RELEASE_NAME" ]; then
  echo "ERROR: No 'name' field in release response." >&2
  echo "Response was: $RELEASE_RESPONSE" >&2
  exit 1
fi
echo "  ✓ Released: $RELEASE_NAME"
echo
echo "=== Deploy complete ==="
echo "Rules active di project $FIREBASE_PROJECT_ID."
echo "Verifikasi: https://console.firebase.google.com/project/$FIREBASE_PROJECT_ID/firestore/rules"
