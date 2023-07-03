ARG NODE_VERSION=20.2.0-alpine

FROM node:$NODE_VERSION as builder

WORKDIR /dep

COPY ./package.json package.json
COPY ./yarn.lock yarn.lock

RUN yarn --frozen-lockfile

COPY ./tsconfig.json tsconfig.json
COPY ./babel.config.js babel.config.js
COPY ./src/ src/

RUN yarn build:bin

FROM node:$NODE_VERSION

WORKDIR /app

COPY --from=builder /dep/bin .

USER 1000

CMD ["sh", "-c", "node index.js queries"]
