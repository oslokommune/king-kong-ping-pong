FROM node:12.14.1-alpine3.9 AS dependencies

WORKDIR /app
RUN chown node:node /app

COPY --chown=node package*.json ./
RUN npm ci --only=production

### Build the project
FROM node:12.14.1-alpine3.9 AS build
ENV NODE_ENV production

WORKDIR /app
COPY --from=dependencies --chown=node /app/node_modules ./node_modules

COPY --chown=node package*.json ./
COPY --chown=node ./tsconfig.json .
COPY --chown=node ./lib ./lib
COPY --chown=node ./server.ts .

RUN npm run tsc

### Run
FROM node:12.14.1-alpine3.9
ENV NODE_ENV production
EXPOSE 3000

WORKDIR /app
CMD ["node", "server.js"]

USER node

COPY --from=dependencies --chown=node /app/node_modules ./node_modules
COPY --from=build --chown=node /app/build .
