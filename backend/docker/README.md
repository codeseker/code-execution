# Docker Sandbox Environments

This directory contains the Dockerfiles and Compose specification for the sandbox runner environments.

## Supported Runtimes
- **C++ (14.2)**: `backend/docker/cpp` (gcc:14.2 with unprivileged sandbox user)
- **Java (21)**: `backend/docker/java` (eclipse-temurin:21-jdk-jammy with unprivileged sandbox user)
- **Python (3.12)**: `backend/docker/python` (python:3.12-slim with unprivileged sandbox user)
- **JavaScript / Node (22)**: `backend/docker/javascript` (node:22-slim with unprivileged sandbox user)

## Execution Modes (`app.execution.container-mode`)

The backend supports 3 execution modes in `application.properties`:

1. **`auto` (Default & Recommended)**:
   - If a static container (`cpp`, `java`, `python`, `javascript`) exists and is currently running, it is used.
   - If the static container is stopped, exited, or not found on the machine, the system **automatically creates a separate, dedicated container** for the submission, runs compilation and testcases in isolation, and destroys the container when done.
   - This ensures tests succeed without needing to manually run and keep containers alive.

2. **`ephemeral`**:
   - Always creates a fresh, separate container for every submission flow (`judge-sub-<submissionId>`) and destroys it upon completion.
   - Provides complete isolation between different users and parallel submissions.

3. **`static`**:
   - Strictly uses pre-created containers named `cpp`, `java`, `python`, `javascript`.

## Starting Pre-Warmed Static Containers (Optional)

If you prefer to keep static containers running:

```bash
cd backend/docker
docker compose up -d --build
```

The updated Dockerfiles use `CMD ["tail", "-f", "/dev/null"]` to ensure the containers remain active in the background.
