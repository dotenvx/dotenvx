# Use a base image
FROM ubuntu:latest

# Set work directory
WORKDIR /app

# Set environment variables for the architecture and OS (change if necessary)
ENV OS=linux
ENV ARCH=amd64

# Install dependencies
RUN apt-get update && apt-get install -y curl

# Fetch the dotenv binary
RUN curl -L https://github.com/dotenv-org/dotenv/releases/latest/download/dotenv-${OS}-${ARCH}.tar.gz | tar -xz -C /usr/local/bin

# Make the binary executable
RUN chmod +x /usr/local/bin/dotenv

# Set the entry point to the dotenv command (optional)
ENTRYPOINT ["/usr/local/bin/dotenv"]
