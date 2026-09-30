# Hardened Java runner: JDK 21 (javac for the compile phase, java to run).
# Note: /tmp stays writable (container layer) for JVM perfdata.
FROM eclipse-temurin:21-jdk-jammy

RUN useradd -m -u 10001 sandbox && \
    mkdir -p /sandbox /tmp/judge && \
    chown -R sandbox:sandbox /sandbox /tmp/judge && \
    chmod 777 /tmp/judge

USER sandbox
WORKDIR /sandbox

CMD ["tail", "-f", "/dev/null"]
