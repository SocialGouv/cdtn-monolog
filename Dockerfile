FROM node:14.13-alpine3.10 as builder

WORKDIR /app

COPY ./package.json package.json
COPY ./src/ src/

RUN yarn install
RUN yarn build

FROM node:14.13-alpine3.10
WORKDIR /app
COPY --from=builder /app/dist/ .

CMD ["sh", "-c", "node index.js ${MONOLOG_ACTION} ${DAYS}"]