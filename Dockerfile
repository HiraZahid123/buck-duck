FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    DATA_DIR=/data \
    NODE_OPTIONS=--no-warnings
COPY package*.json ./
RUN npm ci --omit=dev
COPY core ./core
COPY server ./server
COPY public ./public
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD ["node", "server/index.js"]
