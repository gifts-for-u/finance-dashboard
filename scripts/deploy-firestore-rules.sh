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
# Optional:
#   GCLOUD_OUTPUT                  : path untuk gcloud output file (default: /tmp/gcloud_token.txt)
#
# Required IAM role untuk service account:
#   roles/firebaserules.admin (atau roles/firebase.admin)

set -euo pipefail

# --- Input validation ---
: "${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID is required}"
: "${FIREBASE_RULES_FILE:=./firestore.rules}"
GCLOUD_OUTPUT="${GCLOUD_OUTPUT:-/tmp/gcloud_token.txt}"

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
if ! gcloud auth print-access-token > "$GCLOUD_OUTPUT" 2>/dev/null; then
  echo "ERROR: gcloud auth print-access-token failed." >&2
  echo "Pastikan google-github-actions/auth@v2 sudah jalan sebelumnya," >&2
  echo "dan GOOGLE_APPLICATION_CREDENTIALS menunjuk ke service account JSON valid." >&2
  exit 1
fi
ACCESS_TOKEN=$(cat "$GCLOUD_OUTPUT" | tr -d '\n')
rm -f "$GCLOUD_OUTPUT"

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Empty access token from gcloud." >&2
  exit 1
fi

# --- Step 1: Read rules file & base64-encode (per REST API spec) ---
echo "→ Reading & base64-encoding rules file..."
RULES_B64=$(base64 -w 0 "$FIREBASE_RULES_FILE")

# Build ruleset payload
RULESET_PAYLOAD=$(cat <<EOF
{
  "source": {
    "files": [
      {
        "name": "firestore.rules",
        "content": "$RULES_B64"
      }
    ]
  }
}
EOF
)

# --- Step 2: Create ruleset ---
echo "→ Creating ruleset..."
CREATE_RESPONSE=$(curl -sS -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$RULESET_PAYLOAD" \
  "https://firebaserules.googleapis.com/v1/projects/$FIREBASE_PROJECT_ID/rulesets")

RULESET_NAME=$(echo "$CREATE_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$RULESET_NAME" ]; then
  echo "ERROR: Failed to create ruleset. Response:" >&2
  echo "$CREATE_RESPONSE" >&2
  exit 1
fi
echo "  ✓ Created: $RULESET_NAME"

# --- Step 3: Release ruleset ---
echo "→ Releasing ruleset to cloud.firestore..."
RELEASE_PAYLOAD=$(cat <<EOF
{
  "rulesetName": "$RULESET_NAME"
}
EOF
)

RELEASE_RESPONSE=$(curl -sS -X PATCH \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$RELEASE_PAYLOAD" \
  "https://firebaserules.googleapis.com/v1/projects/$FIREBASE_PROJECT_ID/releases/cloud.firestore")

if echo "$RELEASE_RESPONSE" | grep -q '"name"'; then
  echo "  ✓ Released successfully"
  echo
  echo "=== Deploy complete ==="
  echo "Rules active di project $FIREBASE_PROJECT_ID."
  echo "Verifikasi: https://console.firebase.google.com/project/$FIREBASE_PROJECT_ID/firestore/rules"
else
  echo "ERROR: Failed to release ruleset. Response:" >&2
  echo "$RELEASE_RESPONSE" >&2
  exit 1
fi
