# Hardened C++ runner: g++ toolchain, unprivileged sandbox user.
# Host-side flags enforce network=none, CPU/memory/PID limits.
FROM gcc:14.2

RUN useradd -m -u 10001 sandbox

USER sandbox
WORKDIR /sandbox
