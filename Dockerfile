FROM node:14-alpine

WORKDIR /github/workspace

ENTRYPOINT [ "node", "./index.js" ]