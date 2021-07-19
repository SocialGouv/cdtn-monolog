FROM node:14.17.3-alpine3.14 as builder

WORKDIR /app

COPY ./package.json package.json
COPY ./tsconfig.json tsconfig.json
COPY ./src/ src/

RUN yarn install
RUN yarn build:bin

FROM node:14.17.3-alpine3.14
WORKDIR /app
COPY --from=builder /app/bin .


CMD ["sh", "-c", "node index.js ${MONOLOG_ACTION}"]
