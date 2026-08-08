# Dockerfile for PhotographyWeb

FROM node:18-bullseye-slim

WORKDIR /app

# install app dependencies
COPY package.json ./
RUN npm install --production

# copy app source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
