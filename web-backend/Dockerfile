FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=production
ARG WEB_BACKEND_PORT
EXPOSE ${WEB_BACKEND_PORT}
CMD ["node", "index.js"]