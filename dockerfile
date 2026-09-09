FROM node:18-alpine

WORKDIR /app

# Копируем сервер
COPY server/package*.json ./server/
RUN cd server && npm install

# Копируем клиент и сервер
COPY server/ ./server/
COPY client/ ./client/

WORKDIR /app/server

EXPOSE 3000

CMD ["node", "server.js"]
