# Hardened C++ runner: g++ toolchain, unprivileged sandbox user.
# Host-side flags enforce network=none, CPU/memory/PID limits.
FROM gcc:14.2

RUN useradd -m -u 10001 sandbox && \
    mkdir -p /sandbox /tmp/judge && \
    chown -R sandbox:sandbox /sandbox /tmp/judge && \
    chmod 777 /tmp/judge

USER sandbox
WORKDIR /sandbox

CMD ["tail", "-f", "/dev/null"]
