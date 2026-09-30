# Hardened Node.js runner (interpreted - no compile phase).
FROM node:22-slim

RUN useradd -m -u 10001 sandbox && \
    mkdir -p /sandbox /tmp/judge && \
    chown -R sandbox:sandbox /sandbox /tmp/judge && \
    chmod 777 /tmp/judge

USER sandbox
WORKDIR /sandbox

CMD ["tail", "-f", "/dev/null"]
