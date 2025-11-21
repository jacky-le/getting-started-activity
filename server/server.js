import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { createServer } from "http";
import { Server } from "socket.io";
import { update, spawnPlayer, handleInput } from './src/game.js';
import state from './src/state.js';
import { UPGRADES, MAP_WIDTH, MAP_HEIGHT, FPS } from './src/constants.js';

dotenv.config({ path: "../.env" });

const app = express();
const port = 3001;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

// Allow express to parse JSON bodies
app.use(express.json());

app.post("/api/token", async (req, res) => {
  
  // Exchange the code for an access_token
  const response = await fetch(`https://discord.com/api/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.VITE_DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: req.body.code,
    }),
  });

  // Retrieve the access_token from the response
  const { access_token } = await response.json();

  // Return the access_token to our client as { access_token: "..."}
  res.send({access_token});
});

// --- GAME LOGIC ---

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinGame', (data) => {
        const name = data.name || `GUEST-${Math.floor(Math.random()*1000)}`;
        const cls = data.class || 'ASSAULT';
        spawnPlayer(socket.id, cls, name);
    });

    socket.on('leaveGame', () => {
        delete state.players[socket.id];
    });

    socket.on('input', (data) => {
        if (state.players[socket.id]) handleInput(state.players[socket.id], data);
    });

    socket.on('selectUpgrade', (upgradeId) => {
        const p = state.players[socket.id];
        if (p && p.pendingLevelUp) {
            const upg = UPGRADES.find(u => u.id === upgradeId);
            if (upg) {
                upg.apply(p);
                p.pendingLevelUp = false;
                p.shieldActive = true; 
                setTimeout(() => p.shieldActive = false, 2000);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        delete state.players[socket.id];
    });
});

setInterval(() => {
    update(io);
    
    const totalForWave = 20 + (state.wave * 5);
    const remainingSpawns = Math.max(0, totalForWave - state.enemiesSpawnedInWave);
    const enemiesLeft = state.bossActive ? 1 : (remainingSpawns + state.enemies.length);

    io.emit('state', { 
        players: state.players, 
        bullets: state.bullets, 
        enemies: state.enemies, 
        zones: state.zones, 
        wave: state.wave, 
        bossActive: state.bossActive, 
        events: state.events, 
        map: {w: MAP_WIDTH, h: MAP_HEIGHT},
        enemiesLeft: enemiesLeft,
        frameCount: state.frameCount
    });
    state.events = []; 
}, 1000 / FPS);

httpServer.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
