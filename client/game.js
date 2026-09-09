// Telegram Web App инициализация
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Игровая логика
class TilesSurvival {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 60;
        this.mapSize = 20;
        this.player = { x: 10, y: 10, hero: 'survivor' };
        this.resources = { wood: 0, food: 0, energy: 100 };
        this.map = this.generateMap();
        this.clanMembers = [
            { id: 1, name: 'Сталкер', x: 12, y: 8, hero: 'stalker' },
            { id: 2, name: 'Медик', x: 8, y: 12, hero: 'medic' }
        ];
        
        this.heroes = {
            survivor: { color: '#4ecca3', icon: '🎭' },
            stalker: { color: '#e94560', icon: '👤' },
            medic: { color: '#ffffff', icon: '⚕️' },
            mutant: { color: '#8b4513', icon: '👹' }
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.render();
        
        // Скрыть загрузку
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 1000);
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.tileSize = Math.min(window.innerWidth, window.innerHeight) / 8;
    }
    
    generateMap() {
        const map = [];
        for(let y = 0; y < this.mapSize; y++) {
            map[y] = [];
            for(let x = 0; x < this.mapSize; x++) {
                const rand = Math.random();
                if(rand < 0.1) map[y][x] = { type: 'tree', resource: 3 };
                else if(rand < 0.15) map[y][x] = { type: 'food', resource: 2 };
                else if(rand < 0.2) map[y][x] = { type: 'enemy', hp: 2 };
                else map[y][x] = { type: 'empty' };
            }
        }
        return map;
    }
    
    move(dx, dy) {
        if(this.resources.energy <= 0) return;
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if(newX >= 0 && newX < this.mapSize && newY >= 0 && newY < this.mapSize) {
            this.player.x = newX;
            this.player.y = newY;
            this.resources.energy = Math.max(0, this.resources.energy - 1);
            this.updateUI();
            this.render();
        }
    }
    
    action() {
        const tile = this.map[this.player.y][this.player.x];
        
        if(tile.type === 'tree') {
            this.resources.wood += 1;
            tile.resource -= 1;
            if(tile.resource <= 0) tile.type = 'empty';
            tg.HapticFeedback.impactOccurred('light');
        } else if(tile.type === 'food') {
            this.resources.food += 1;
            this.resources.energy = Math.min(100, this.resources.energy + 20);
            tile.resource -= 1;
            if(tile.resource <= 0) tile.type = 'empty';
            tg.HapticFeedback.notificationOccurred('success');
        }
        
        this.updateUI();
        this.render();
    }
    
    updateUI() {
        document.getElementById('wood').textContent = this.resources.wood;
        document.getElementById('food').textContent = this.resources.food;
        document.getElementById('energy').textContent = this.resources.energy;
    }
    
    render() {
        this.ctx.fillStyle = '#16213e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const offsetX = this.canvas.width/2 - this.player.x * this.tileSize;
        const offsetY = this.canvas.height/2 - this.player.y * this.tileSize;
        
        // Отрисовка карты
        for(let y = 0; y < this.mapSize; y++) {
            for(let x = 0; x < this.mapSize; x++) {
                const screenX = offsetX + x * this.tileSize;
                const screenY = offsetY + y * this.tileSize;
                
                // Тайл
                this.ctx.fillStyle = '#0f3460';
                this.ctx.fillRect(screenX, screenY, this.tileSize-2, this.tileSize-2);
                
                // Содержимое
                const tile = this.map[y][x];
                this.ctx.font = `${this.tileSize*0.6}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                if(tile.type === 'tree') {
                    this.ctx.fillText('🌲', screenX + this.tileSize/2, screenY + this.tileSize/2);
                } else if(tile.type === 'food') {
                    this.ctx.fillText('🍎', screenX + this.tileSize/2, screenY + this.tileSize/2);
                } else if(tile.type === 'enemy') {
                    this.ctx.fillText('👹', screenX + this.tileSize/2, screenY + this.tileSize/2);
                }
            }
        }
        
        // Отрисовка членов клана
        this.clanMembers.forEach(member => {
            const screenX = offsetX + member.x * this.tileSize;
            const screenY = offsetY + member.y * this.tileSize;
            
            this.ctx.fillStyle = this.heroes[member.hero].color;
            this.ctx.beginPath();
            this.ctx.arc(screenX + this.tileSize/2, screenY + this.tileSize/2, this.tileSize/3, 0, Math.PI*2);
            this.ctx.fill();
            
            this.ctx.fillText(this.heroes[member.hero].icon, 
                screenX + this.tileSize/2, 
                screenY + this.tileSize/2);
        });
        
        // Отрисовка игрока
        const px = offsetX + this.player.x * this.tileSize;
        const py = offsetY + this.player.y * this.tileSize;
        
        this.ctx.fillStyle = '#e94560';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#e94560';
        this.ctx.beginPath();
        this.ctx.arc(px + this.tileSize/2, py + this.tileSize/2, this.tileSize/2.5, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${this.tileSize*0.5}px Arial`;
        this.ctx.fillText('🎭', px + this.tileSize/2, py + this.tileSize/2);
    }
}

const game = new TilesSurvival();

// UI функции
function toggleClan() {
    const panel = document.getElementById('clanPanel');
    panel.classList.toggle('visible');
}

// Свайп управление
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    if(Math.abs(dx) > Math.abs(dy)) {
        if(dx > 30) game.move(1, 0);
        else if(dx < -30) game.move(-1, 0);
    } else {
        if(dy > 30) game.move(0, 1);
        else if(dy < -30) game.move(0, -1);
    }
});
