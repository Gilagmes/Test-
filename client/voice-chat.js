// WebRTC голосовой чат (требует сервер для signaling)
class VoiceChat {
    constructor() {
        this.ws = null;
        this.localStream = null;
        this.peers = new Map();
        this.isConnected = false;
        this.roomId = 'clan_room_1'; // В реальном приложении - динамический ID
    }
    
    async init() {
        try {
            // Подключение к signaling серверу
            const wsUrl = window.location.hostname === 'localhost' 
                ? 'ws://localhost:3000' 
                : 'wss://your-render-url.onrender.com';
                
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('Подключено к голосовому серверу');
                this.joinRoom();
            };
            
            this.ws.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                await this.handleSignaling(data);
            };
            
        } catch(e) {
            console.error('Ошибка подключения:', e);
            alert('Голосовой чат временно недоступен');
        }
    }
    
    async startVoice() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: false 
            });
            this.isConnected = true;
            document.getElementById('voiceBtn').classList.add('active');
            
            // Уведомляем сервер о готовности
            this.ws.send(JSON.stringify({
                type: 'ready',
                roomId: this.roomId
            }));
            
        } catch(e) {
            console.error('Нет доступа к микрофону:', e);
        }
    }
    
    stopVoice() {
        if(this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        this.isConnected = false;
        document.getElementById('voiceBtn').classList.remove('active');
        
        // Закрываем все соединения
        this.peers.forEach(peer => peer.close());
        this.peers.clear();
    }
    
    async handleSignaling(data) {
        switch(data.type) {
            case 'offer':
                await this.handleOffer(data);
                break;
            case 'answer':
                await this.handleAnswer(data);
                break;
            case 'ice-candidate':
                await this.handleIceCandidate(data);
                break;
            case 'user-joined':
                this.createPeerConnection(data.userId, true);
                break;
        }
    }
    
    createPeerConnection(userId, isInitiator) {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        // Добавляем локальный стрим
        if(this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }
        
        // Обработка входящего стрима
        pc.ontrack = (event) => {
            console.log('Получен аудио поток от:', userId);
            // Здесь можно добавить индикатор "говорит"
            document.getElementById('voice1').classList.add('speaking');
        };
        
        pc.onicecandidate = (event) => {
            if(event.candidate) {
                this.ws.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    targetUserId: userId,
                    roomId: this.roomId
                }));
            }
        };
        
        this.peers.set(userId, pc);
        
        if(isInitiator) {
            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
                this.ws.send(JSON.stringify({
                    type: 'offer',
                    offer: offer,
                    targetUserId: userId,
                    roomId: this.roomId
                }));
            });
        }
        
        return pc;
    }
    
    joinRoom() {
        this.ws.send(JSON.stringify({
            type: 'join',
            roomId: this.roomId,
            userId: tg.initDataUnsafe.user?.id || 'user_' + Math.random().toString(36).substr(2, 9)
        }));
    }
}

const voiceChat = new VoiceChat();

function toggleVoice() {
    if(voiceChat.isConnected) {
        voiceChat.stopVoice();
    } else {
        voiceChat.startVoice();
    }
}

// Автоинициализация при загрузке
window.addEventListener('load', () => {
    voiceChat.init();
});
