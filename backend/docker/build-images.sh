#!/usr/bin/env bash
# Builds the four hardened runner images referenced by
# app.execution.images.* in application.properties.
set -euo pipefail
cd "$(dirname "$0")"

docker build -t code-exec-cpp:latest     cpp
docker build -t code-exec-java:latest    java
docker build -t code-exec-python:latest  python
docker build -t code-exec-js:latest      javascript

echo "All runner images built."
