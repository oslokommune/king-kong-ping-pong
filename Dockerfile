FROM node:12.14.1-alpine3.9 AS dependencies

ARG NPM_TOKEN
ENV NODE_ENV production

WORKDIR /app
RUN chown node:node /app

COPY --chown=node package*.json ./
COPY --chown=node .npmrc ./
RUN echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc
RUN npm ci --only=production

FROM node:12.14.1-alpine3.9

WORKDIR /app
ENV NODE_ENV production
EXPOSE 3000
CMD ["node", "server.js"]

USER node

COPY --from=dependencies --chown=node /app/node_modules ./node_modules
COPY --chown=node . .
