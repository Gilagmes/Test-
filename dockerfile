FROM node:18-alpine

WORKDIR /app

# Копируем и устанавливаем зависимости сервера
COPY server/package*.json ./server/
RUN cd server && npm install

# Копируем весь код
COPY server/ ./server/
COPY client/ ./client/

# Открываем порт
EXPOSE 3000

# Запускаем сервер
CMD ["node", "server/server.js"]
