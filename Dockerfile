ARG NODE_VERSION=20.3.1-alpine
FROM node:$NODE_VERSION as builder

WORKDIR /app

COPY ./package.json package.json
COPY ./tsconfig.json tsconfig.json
COPY ./src/ src/

RUN yarn install
RUN yarn build:bin

FROM node:$NODE_VERSION
WORKDIR /app
COPY --from=builder /app/bin .


CMD ["sh", "-c", "node index.js ${MONOLOG_ACTION}"]
