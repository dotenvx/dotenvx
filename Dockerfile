# Use a base image
FROM ubuntu:latest

# Set work directory
WORKDIR /app

# Set environment variables for the architecture and OS (change if necessary)
ENV OS=linux

# Install dependencies
RUN apt-get update && apt-get install -y curl

# Extract architecture from TARGETPLATFORM environment variable and fetch dotenvx binary
ARG TARGETPLATFORM
RUN ARCH=$(echo ${TARGETPLATFORM} | cut -f2 -d '/') && \
    echo "Architecture: ${ARCH}" && \
    curl -L https://github.com/dotenvx/dotenvx/releases/latest/download/dotenvx-${OS}-${ARCH}.tar.gz | tar -xz -C /usr/local/bin

# Make the binary executable
RUN chmod +x /usr/local/bin/dotenvx

# Set the entry point to the dotenvx command (optional)
ENTRYPOINT ["/usr/local/bin/dotenvx"]
