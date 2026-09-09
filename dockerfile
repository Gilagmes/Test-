FROM node:18-alpine

WORKDIR /app

# Сначала копируем package.json из server/
COPY server/package*.json ./
RUN npm install

# Потом копируем весь сервер и клиент
COPY server/ ./server/
COPY client/ ./client/

# Указываем рабочую директорию сервера
WORKDIR /app/server

EXPOSE 3000

CMD ["node", "server.js"]
