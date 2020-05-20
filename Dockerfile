FROM node:12.14-alpine3.10 as builder

WORKDIR /app

COPY ./package.json package.json
COPY ./src/ src/

RUN yarn install
RUN yarn build

FROM node:12.14-alpine3.10
WORKDIR /app
COPY --from=builder /app/dist/ .

CMD ["node", "index.js"]