#!/usr/bin/env bash
# Deploys the current build of this node to the remote n8n instance
# (n8n.srv1259734.hstgr.cloud) as a custom extension, and restarts the
# n8n container so it picks it up.
#
# Requires the "joinpoint-vps" SSH host alias (see ~/.ssh/config):
#   Host joinpoint-vps
#       HostName 168.231.107.251
#       User root
#       IdentityFile ~/.ssh/id_ed25519
set -euo pipefail

cd "$(dirname "$0")/.."

REMOTE_HOST="joinpoint-vps"
CONTAINER="n8n-n8n-1"
PKG_NAME="n8n-nodes-joinpoint"

echo "==> Building"
rm -f .tsbuildinfo
npm run build

echo "==> Packing"
PACK_DIR="$(mktemp -d)"
npm pack --pack-destination "$PACK_DIR" >/dev/null
TARBALL="$(ls "$PACK_DIR"/${PKG_NAME}-*.tgz)"
TARBALL_NAME="$(basename "$TARBALL")"

echo "==> Uploading $TARBALL_NAME"
scp -q "$TARBALL" "${REMOTE_HOST}:/root/${TARBALL_NAME}"
rm -rf "$PACK_DIR"

echo "==> Installing into container custom extensions dir"
ssh "$REMOTE_HOST" "docker cp /root/${TARBALL_NAME} ${CONTAINER}:/tmp/${TARBALL_NAME}"
ssh "$REMOTE_HOST" "docker exec ${CONTAINER} sh -c '
  mkdir -p /home/node/.n8n/custom &&
  cd /home/node/.n8n/custom &&
  [ -f package.json ] || npm init -y >/dev/null &&
  npm install /tmp/${TARBALL_NAME}
'"
ssh "$REMOTE_HOST" "rm -f /root/${TARBALL_NAME}"

echo "==> Restarting n8n container (brief downtime for active workflows)"
ssh "$REMOTE_HOST" "docker restart ${CONTAINER}"

echo "==> Waiting for n8n to come back up"
sleep 8
ssh "$REMOTE_HOST" "docker logs --tail 20 ${CONTAINER}"

echo "==> Done. Check the log above for 'Unrecognized node type' errors."
