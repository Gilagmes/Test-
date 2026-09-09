const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Раздаём клиент (папка client в корне)
app.use(express.static(path.join(__dirname, 'client')));

// WebRTC signaling
const rooms = new Map();

wss.on('connection', (ws) => {
    let currentRoom = null;
    let userId = null;
    
    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            
            if(data.type === 'join') {
                userId = data.userId;
                currentRoom = data.roomId;
                if(!rooms.has(currentRoom)) rooms.set(currentRoom, new Map());
                rooms.get(currentRoom).set(userId, ws);
                
                // Уведомить других
                rooms.get(currentRoom).forEach((client, id) => {
                    if(id !== userId && client.readyState === 1) {
                        client.send(JSON.stringify({type: 'user-joined', userId}));
                    }
                });
            }
            else if(['offer','answer','ice-candidate'].includes(data.type)) {
                const target = rooms.get(currentRoom)?.get(data.targetUserId);
                if(target) target.send(JSON.stringify({...data, userId}));
            }
        } catch(e) {}
    });
    
    ws.on('close', () => {
        if(currentRoom) rooms.get(currentRoom)?.delete(userId);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server on', PORT));
