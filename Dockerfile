# link to 2.5 due to this https://github.com/barrysteyn/node-scrypt/issues/82
FROM iojs:2.5
RUN mkdir /opt/coordinator
COPY . /opt/coordinator
WORKDIR /opt/coordinator
RUN rm -rf node_modules && npm install && cp config.js.master config.js
CMD ["iojs", "index"]
