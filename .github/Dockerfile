FROM debian:buster-slim as stage0
COPY ./tools/* /dotenv/
RUN cp /dotenv/aarch64 /usr/local/bin/dotenv
RUN echo 'export PS1="\\[\\033[38;5;63m\\]dotenv\\[\\033[0m\\] $ "' >> /root/.bashrc

FROM debian:buster-slim as stage1
RUN apt-get update && apt --yes install libc-dev libstdc++-8-dev libgcc-8-dev netbase libudev-dev
COPY --from=stage0 /usr/local/bin/dotenv /usr/local/bin/dotenv
COPY --from=stage0 /root/.bashrc /root/.bashrc
ENV BASH_ENV /root/.bashrc
SHELL ["/bin/bash", "-c"]
CMD ["bash", "-i"]
