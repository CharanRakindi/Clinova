#!/bin/sh
set -e

# Compose / AWS: default 80. Override PORT if a reverse proxy maps another host port.
export PORT="${PORT:-80}"
# Docker Compose service hostname for the API container
export API_HOST="${API_HOST:-api:5001}"

envsubst '${API_HOST} ${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
