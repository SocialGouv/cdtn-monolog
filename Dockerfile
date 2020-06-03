FROM node:14.4-alpine3.10 as builder

WORKDIR /app

COPY ./package.json package.json
COPY ./src/ src/

RUN yarn install
RUN yarn build

FROM node:14.4-alpine3.10
WORKDIR /app
COPY --from=builder /app/dist/ .

ENTRYPOINT ["node", "index.js"]