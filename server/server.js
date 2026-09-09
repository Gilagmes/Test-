const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Раздача статики (клиент)
app.use(express.static(path.join(__dirname, '../client')));

// Хранилище комнат
const rooms = new Map();

wss.on('connection', (ws) => {
    let currentRoom = null;
    let userId = null;
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch(data.type) {
                case 'join':
                    userId = data.userId;
                    currentRoom = data.roomId;
                    
                    if(!rooms.has(currentRoom)) {
                        rooms.set(currentRoom, new Map());
                    }
                    rooms.get(currentRoom).set(userId, ws);
                    
                    // Уведомляем других о новом участнике
                    broadcast(currentRoom, {
                        type: 'user-joined',
                        userId: userId
                    }, ws);
                    break;
                    
                case 'offer':
                case 'answer':
                case 'ice-candidate':
                    // Пересылаем signaling данные
                    const targetWs = rooms.get(currentRoom)?.get(data.targetUserId);
                    if(targetWs) {
                        targetWs.send(JSON.stringify({
                            ...data,
                            userId: userId
                        }));
                    }
                    break;
            }
        } catch(e) {
            console.error('Ошибка обработки:', e);
        }
    });
    
    ws.on('close', () => {
        if(currentRoom && rooms.has(currentRoom)) {
            rooms.get(currentRoom).delete(userId);
            if(rooms.get(currentRoom).size === 0) {
                rooms.delete(currentRoom);
            }
        }
    });
});

function broadcast(roomId, message, excludeWs) {
    if(rooms.has(roomId)) {
        rooms.get(roomId).forEach((ws) => {
            if(ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
