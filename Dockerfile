FROM node:12.14-alpine3.10

WORKDIR /app

COPY ./package.json package.json
COPY ./src/ src/

RUN yarn install