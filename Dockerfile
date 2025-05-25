FROM ubuntu:18.04

ENV PYTHON_VERSION 3.7.7
ENV PYTHON_PIP_VERSION 20.1
ENV DEBIAN_FRONTEND noninteractive
ENV NODE_VERSION 16

RUN apt-get update && apt-get -y install gcc mono-mcs golang-go \
    default-jre default-jdk python3-pip python3 curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN node -v && npm -v

RUN useradd -m -u 10001 appuser

RUN id -u appuser

WORKDIR /app
COPY . /app
RUN chown -R appuser:appuser /app

USER root
RUN npm install --unsafe-perm

USER appuser

EXPOSE 8080

CMD ["npm", "start"]
