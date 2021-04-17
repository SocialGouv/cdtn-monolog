FROM node:15.14-alpine3.10 as builder

WORKDIR /app

COPY ./package.json package.json
COPY ./tsconfig.json tsconfig.json
COPY ./src/ src/

RUN yarn install
RUN yarn build

FROM node:15.14-alpine3.10
WORKDIR /app
COPY --from=builder /app/dist/ .


CMD ["sh", "-c", "node index.js ${MONOLOG_ACTION}"]