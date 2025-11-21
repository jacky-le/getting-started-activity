import SoundManager from './sound.js';

export function initGame(socket, defaultName) {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const soundManager = new SoundManager();

    // --- UI REFERENCES ---
    const ui = {
        hpBar: document.getElementById('hp-bar'),
        hpText: document.getElementById('hp-text'),
        xpBar: document.getElementById('xp-bar'),
        lvlText: document.getElementById('lvl-text'),
        msg: document.getElementById('message-area'),
        modal: document.getElementById('upgrade-modal'),
        cards: document.getElementById('cards-container'),
        abilityIcon: document.getElementById('ability-icon'),
        abilityOverlay: document.getElementById('ability-cooldown-overlay'),
        abilityName: document.getElementById('ability-name'),
        abilityStatus: document.getElementById('ability-status'),
        bossHud: document.getElementById('boss-hud'),
        bossName: document.getElementById('boss-name'),
        bossHpBar: document.getElementById('boss-hp-bar'),
        waveNum: document.getElementById('wave-num'),
        enemiesCount: document.getElementById('enemies-count'),
        lbList: document.getElementById('lb-list'),
        startScreen: document.getElementById('start-screen'),
        playBtn: document.getElementById('play-btn'),
        deathScreen: document.getElementById('death-screen'),
        spectateBtn: document.getElementById('spectate-btn'),
        spectateUI: document.getElementById('spectate-ui'),
        infoName: document.getElementById('info-name'),
        infoPrimary: document.getElementById('info-primary'),
        infoAbility: document.getElementById('info-ability'),
        infoDesc: document.getElementById('info-desc'),
        menuBtn: document.getElementById('menu-btn'),
        spectateReturnBtn: document.getElementById('spectate-return-btn'),
        classCards: document.querySelectorAll('.class-card')
    };

    const CLASS_INFO = {
        SCOUT: {
            primary: "Rapid fire, triple burst.",
            ability: "WARP JUMP (Teleport forward)",
            desc: "Agile reconnaissance unit. Low durability but high mobility."
        },
        HEAVY: {
            primary: "Rocket Propelled Grenade.",
            ability: "FORTRESS MODE (Immobile + Rate + Defense)",
            desc: "Siege unit. Locks down position to unleash hell."
        },
        SNIPER: {
            primary: "Gauss Rifle (Instant/Pierce).",
            ability: "CALIBRATE (Next Shot 5x Dmg)",
            desc: "High-tech marksman. Rewards patience and precision."
        },
        ASSAULT: {
            primary: "Balanced rapid fire.",
            ability: "MISSILE SWARM (Homing Barrage)",
            desc: "Versatile frontline combatant suitable for any situation."
        },
        ENGINEER: {
            primary: "Tesla Stream (Chain Lightning).",
            ability: "SENTRY GUN (Deploy Auto-Turret)",
            desc: "Tech specialist. Builds automated defenses."
        },
        PYRO: {
            primary: "Twin flamethrowers.",
            ability: "OVERHEAT (Area Damage Ring)",
            desc: "Close-quarters chaos. Burns everything in range."
        },
        LANCER: {
            primary: "Heavy piercing lance.",
            ability: "VOID STRIKE (Dash Damage)",
            desc: "High-momentum striker. Dashes through enemies to destroy them."
        },
        GHOST: {
            primary: "Spectral Boomerangs.",
            ability: "SOUL REAP (AoE Damage + Heal)",
            desc: "Spirit walker. Harvests life force from enemies."
        },
        TITAN: {
            primary: "Quad-cannon shotgun.",
            ability: "EARTH SHATTER (AoE Slam)",
            desc: "Massive siege engine. Controls space with raw power."
        },
        SUMMONER: {
            primary: "Standard energy bolts.",
            ability: "DEPLOY DRONES (Sentry Turrets)",
            desc: "Tactician. Controls the battlefield with automated units."
        },
        BERSERKER: {
            primary: "Heavy spread shot.",
            ability: "BLOOD FURY (Double Fire Rate)",
            desc: "Risk-taker. Grows stronger as hull integrity drops."
        },
        CHRONOS: {
            primary: "Temporal rounds.",
            ability: "ZA WARUDO (Stop Time)",
            desc: "Time manipulator. Freezes enemies to control the flow of battle."
        },
        ALCHEMIST: {
            primary: "Acid Canisters.",
            ability: "STIM PACK (Boost Speed/FireRate)",
            desc: "Chemical warfare expert. Melts armor and boosts allies."
        },
        WARDEN: {
            primary: "Ricocheting Discus.",
            ability: "SANCTUARY (Safe Zone)",
            desc: "Protector. Creates zones that heal and shield allies."
        },
        BARD: {
            primary: "Sonic Waves (Wide/Pierce).",
            ability: "POWER CHORD (Knockback + Heal)",
            desc: "Battlefield musician. Controls crowds and uplifts morale."
        },
        SHADE: {
            primary: "Shadow Bolts.",
            ability: "NIGHTMARE (Fear Nearby Enemies)",
            desc: "Disruptor. Terrifies enemies, forcing them to flee."
        },
        JUGGERNAUT: {
            primary: "Heavy Cannons.",
            ability: "UNSTOPPABLE (Invulnerable Charge)",
            desc: "Unstoppable force. Charges through enemies without taking damage."
        },
        ARCANIST: {
            primary: "Arcane Missiles (Homing).",
            ability: "SINGULARITY (Black Hole)",
            desc: "Space warper. Creates gravity wells that pull enemies in."
        },
        GAMBLER: {
            primary: "Random Projectiles.",
            ability: "ROLL THE DICE (Random Effect)",
            desc: "High roller. Relies on luck for massive damage or utility."
        },
        TRAPPER: {
            primary: "High Velocity Nails.",
            ability: "MINEFIELD (Deploy Explosives)",
            desc: "Area denial. Sets traps to decimate enemy waves."
        },
        NINJA: {
            primary: "Piercing Shurikens.",
            ability: "SMOKE BOMB (Decoy + Stealth)",
            desc: "Elusive assassin. Confuses enemies with decoys."
        },
        DRUID: {
            primary: "Thorn Volley.",
            ability: "ROOTS (Immobilize Enemies)",
            desc: "Nature's wrath. Locks enemies in place."
        },
        VOLT: {
            primary: "Lightning Bolts.",
            ability: "THUNDERSTRUCK (Screen Stun)",
            desc: "High voltage. Stuns and damages all enemies on screen."
        },
        COMMANDER: {
            primary: "Heavy Rifle.",
            ability: "AIRSTRIKE (Bombardment)",
            desc: "Field leader. Calls in heavy ordinance support."
        },
        HUNTRESS: {
            primary: "Precision Arrows.",
            ability: "HUNTER'S MARK (Vulnerability)",
            desc: "Trophy hunter. Marks enemies to take extra damage."
        },
        NECROMANCER: {
            primary: "Bone Shards.",
            ability: "ARISE (Summon Minions)",
            desc: "Dark summoner. Raises the dead to fight for you."
        },
        BEAMER: {
            primary: "Laser Beam.",
            ability: "PRISM CORE (Split Beam)",
            desc: "Energy specialist. Fires piercing lasers."
        },
        GUNSLINGER: {
            primary: "Revolver.",
            ability: "DEAD EYE (Auto-Target All)",
            desc: "Quick draw. Takes out multiple targets instantly."
        },
        SHAMAN: {
            primary: "Spirit Bolts.",
            ability: "SUMMON TOTEM (Random Effect)",
            desc: "Tribal mystic. Summons totems to aid allies or harm enemies."
        },
        PLAGUE: {
            primary: "Viral Darts.",
            ability: "PANDEMIC (Poison Burst)",
            desc: "Disease carrier. Spreads deadly toxins."
        },
        RONIN: {
            primary: "Katana Slash.",
            ability: "OMNISLASH (Rapid Slashes)",
            desc: "Master swordsman. Rapidly strikes nearby enemies."
        },
        HIVE: {
            primary: "Stinger Shot.",
            ability: "SWARM (Release Insects)",
            desc: "Insectoid host. Controls a swarm of living bullets."
        },
        GRAVITY: {
            primary: "Singularity Orb.",
            ability: "REPULSE (Mass Knockback)",
            desc: "Physics manipulator. Controls the flow of battle."
        },
        MARINE: {
            primary: "Assault Rifle.",
            ability: "NUKE GRENADE (Massive Explosion)",
            desc: "Elite soldier. Brings heavy ordnance to the field."
        },
        PIRATE: {
            primary: "Hand Cannon.",
            ability: "CANNONBALL (Bouncing projectile)",
            desc: "High seas plunderer. Fires massive bouncing shots."
        }
    };

    // --- GLOBALS ---
    let myId = null;
    let gameState = null;
    let particles = [];
    let floatingTexts = [];
    let stars = []; // Starfield
    let camX = 0, camY = 0;
    let shake = 0;
    let isUpgradeMenuOpen = false;
    let selectedClass = 'ASSAULT';
    let inGame = false;
    let isDead = false;
    let isSpectating = false;

    // --- SETUP ---
    function resize() { 
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight; 
        initStars();
    }
    
    function initStars() {
        stars = [];
        for(let i=0; i<200; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                z: Math.random() * 2 + 0.5, // Depth factor
                size: Math.random() * 2
            });
        }
    }
    
    window.addEventListener('resize', resize);
    resize();

    // --- LOBBY & DEATH LOGIC ---
    function selectClass(cls) {
        selectedClass = cls;
        ui.classCards.forEach(el => el.classList.remove('selected'));
        const card = document.getElementById(`card-${cls}`);
        if(card) card.classList.add('selected');

        // Update Info Panel
        const info = CLASS_INFO[cls];
        if (info) {
            ui.infoName.innerText = cls;
            ui.infoPrimary.innerText = info.primary;
            ui.infoAbility.innerText = info.ability;
            ui.infoDesc.innerText = info.desc;
        }
    };

    // Attach Listeners
    ui.classCards.forEach(card => {
        card.addEventListener('click', () => {
            const cls = card.id.replace('card-', '');
            selectClass(cls);
        });
    });

    ui.menuBtn.addEventListener('click', () => {
        resetToMenu();
    });

    ui.spectateReturnBtn.addEventListener('click', () => {
        resetToMenu();
    });

    function resetToMenu() {
        socket.emit('leaveGame');
        ui.deathScreen.style.display = 'none';
        ui.spectateUI.style.display = 'none';
        ui.startScreen.style.display = 'flex';
        inGame = false;
        isDead = false;
        isSpectating = false;
        // Clear client-side arrays to free memory
        particles = [];
        floatingTexts = [];
        // Note: gameState is overwritten on next server update
    }

    // Initialize selection
    selectClass('ASSAULT');

    ui.playBtn.addEventListener('click', () => {
        const name = defaultName || 'Pilot';
        socket.emit('joinGame', { name: name, class: selectedClass });
        ui.startScreen.style.display = 'none';
        ui.spectateUI.style.display = 'none';
        inGame = true;
        isDead = false;
        isSpectating = false;
        initAudio();
    });

    ui.spectateBtn.addEventListener('click', () => {
        ui.deathScreen.style.display = 'none';
        isSpectating = true;
        ui.spectateUI.style.display = 'flex';
    });

    // --- INPUT ---
    const input = { up: false, down: false, left: false, right: false, mouseX: 0, mouseY: 0, shooting: false, space: false, camX: 0, camY: 0 };
    function sendInput() { if (!inGame || isDead) return; input.camX = camX; input.camY = camY; socket.emit('input', input); }

    // Initialize Audio on first interaction
    let audioInit = false;
    function initAudio() {
        if (!audioInit) {
            soundManager.resume();
            audioInit = true;
        }
    }

    window.addEventListener('keydown', (e) => {
        initAudio();
        if (isUpgradeMenuOpen || !inGame || isDead) return;
        if (e.code === 'KeyW' || e.code === 'ArrowUp') input.up = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') input.down = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = true;
        if (e.code === 'Space') input.space = true;
        sendInput();
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') input.up = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') input.down = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = false;
        if (e.code === 'Space') input.space = false;
        sendInput();
    });

    window.addEventListener('mousemove', (e) => { input.mouseX = e.clientX; input.mouseY = e.clientY; sendInput(); });
    window.addEventListener('mousedown', () => { 
        initAudio();
        if (!isUpgradeMenuOpen && inGame && !isDead) { 
            input.shooting = true; 
            sendInput(); 
            // Client-side prediction for shoot sound
            let soundType = 'pea';
            if (['HEAVY', 'TITAN', 'JUGGERNAUT', 'COMMANDER', 'PIRATE'].includes(selectedClass)) soundType = 'heavy';
            else if (['SNIPER', 'RAILGUNNER', 'HUNTRESS'].includes(selectedClass)) soundType = 'sniper';
            else if (['BERSERKER', 'TITAN'].includes(selectedClass)) soundType = 'shotgun';
            
            soundManager.shoot(soundType);
        } 
    });
    window.addEventListener('mouseup', () => { input.shooting = false; sendInput(); });

    // --- NETWORK ---
    socket.on('connect', () => { myId = socket.id; });
    socket.on('state', (state) => {
        gameState = state;
        gameState.events.forEach(ev => {
            if (ev.type === 'HIT') {
                spawnText(ev.val, ev.x, ev.y, ev.color || '#fff');
                soundManager.hit();
            }
            else if (ev.type === 'TEXT') spawnText(ev.msg, ev.x, ev.y, ev.color || '#fff', 30);
            else if (ev.type === 'EXPLOSION') {
                spawnExplosion(ev.x, ev.y, ev.size, '#ff5500');
                soundManager.explosion(ev.size);
            }
            else if (ev.type === 'WARN') { 
                ui.msg.innerText = ev.msg; shake = 20; setTimeout(() => ui.msg.innerText = '', 3000); 
                soundManager.warning();
            }
            else if (ev.type === 'EFFECT') {
                soundManager.ability(ev.name);
                if (ev.name === 'BLINK') spawnExplosion(ev.x, ev.y, 30, '#00ffcc');
                if (ev.name === 'EMP') spawnShockwave(ev.x, ev.y, '#ff00ff');
                if (ev.name === 'HEAL') { spawnShockwave(ev.x, ev.y, '#00ff00'); spawnText("REPAIR", ev.x, ev.y - 40, '#00ff00', 15); }
                if (ev.name === 'SLAM') { spawnShockwave(ev.x, ev.y, '#552200'); shake = 30; }
                if (ev.name === 'STIM') { spawnShockwave(ev.x, ev.y, '#00ff00'); spawnText("STIM!", ev.x, ev.y - 40, '#00ff00', 15); }
                if (ev.name === 'ANTHEM') { spawnShockwave(ev.x, ev.y, '#ff66cc'); spawnText("ROCK ON!", ev.x, ev.y - 40, '#ff66cc', 15); }
                if (ev.name === 'FEAR') { spawnShockwave(ev.x, ev.y, '#4b0082'); spawnText("FEAR", ev.x, ev.y - 40, '#4b0082', 20); }
            }
        });


        // Update HUD Globals
        ui.waveNum.innerText = gameState.wave;
        ui.enemiesCount.innerText = gameState.enemiesLeft || 0;

        // Update Leaderboard
        if (state.frameCount % 30 === 0) { // Update every ~0.5s to save DOM ops
            const players = Object.values(gameState.players).sort((a, b) => (b.kills||0) - (a.kills||0));
            ui.lbList.innerHTML = players.map(p => `
                <div class="lb-entry ${p.id === myId ? 'me' : ''}">
                    <span class="lb-name" style="color:${p.color}">${p.name}</span>
                    <span class="lb-kills">${p.kills || 0} KILLS</span>
                </div>
            `).join('');
        }

        // Boss HUD
        if (gameState.bossActive) {
            ui.bossHud.style.display = 'block';
            let boss = gameState.enemies.find(e => e.type === 'BOSS');
            if (boss) {
                ui.bossName.innerText = boss.name || "BOSS";
                ui.bossHpBar.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
            } else {
                 ui.bossHud.style.display = 'none';
            }
        } else {
            ui.bossHud.style.display = 'none';
        }

        // Handle My Player
        if (inGame && gameState.players[myId]) {
            const me = gameState.players[myId];
            
            // Death Check
            if (me.hp <= 0 && !isDead) {
                isDead = true;
                ui.deathScreen.style.display = 'flex';
                soundManager.playTone(100, 'sawtooth', 1.0, 0.8, 20); // Death sound
            }

            if (!isDead) {
                const hpPct = (me.hp / me.maxHp) * 100;
                ui.hpBar.style.width = `${Math.max(0, hpPct)}%`;
                ui.hpText.innerText = `HULL: ${Math.ceil(me.hp)} / ${Math.ceil(me.maxHp)}`;
                const xpPct = (me.xp / me.nextLevel) * 100;
                ui.xpBar.style.width = `${Math.min(100, xpPct)}%`;
                ui.lvlText.innerText = `LVL ${me.level}`;
                
                ui.abilityName.innerText = me.abilityName || "ABILITY";
                ui.abilityIcon.style.borderColor = me.color;
                ui.abilityName.style.color = me.color;

                if (me.cooldownTimer > 0) {
                    const pct = (me.cooldownTimer / me.abilityCd) * 100;
                    ui.abilityOverlay.style.height = `${pct}%`;
                    ui.abilityStatus.innerText = `${(me.cooldownTimer / 60).toFixed(1)}s`;
                } else {
                    ui.abilityOverlay.style.height = `0%`;
                    ui.abilityStatus.innerText = "READY";
                }
                
                // Camera follows ME with Look-Ahead
                const targetCamX = me.x - canvas.width / 2 + (input.mouseX - canvas.width/2) * 0.3;
                const targetCamY = me.y - canvas.height / 2 + (input.mouseY - canvas.height/2) * 0.3;
                camX += (targetCamX - camX) * 0.1; 
                camY += (targetCamY - camY) * 0.1;
            } else if (isSpectating) {
                // Camera follows nearest alive player
                let target = null;
                for (let id in gameState.players) {
                    if (gameState.players[id].hp > 0) { target = gameState.players[id]; break; }
                }
                if (target) {
                    const targetCamX = target.x - canvas.width / 2;
                    const targetCamY = target.y - canvas.height / 2;
                    camX += (targetCamX - camX) * 0.1; camY += (targetCamY - camY) * 0.1;
                }
            }
        }
    });

    socket.on('levelUpOptions', (options) => {
        soundManager.powerup();
        isUpgradeMenuOpen = true; ui.modal.style.display = 'flex'; ui.cards.innerHTML = '';
        input.up=false; input.down=false; input.left=false; input.right=false; input.shooting=false; sendInput();
        options.forEach(opt => {
            const card = document.createElement('div'); card.className = `upgrade-card rarity-${opt.rarity}`;
            card.innerHTML = `<div class="card-title">${opt.name}</div><div class="card-desc">${opt.desc}</div>`;
            card.onclick = () => { 
                soundManager.playTone(600, 'sine', 0.1, 0.5); // Click sound
                socket.emit('selectUpgrade', opt.id); 
                ui.modal.style.display = 'none'; 
                isUpgradeMenuOpen = false; 
            };
            ui.cards.appendChild(card);
        });
    });

    // --- RENDER ---
    function draw() {
        requestAnimationFrame(draw);
        if (!gameState) return;
        
        // Clear with slight fade for trail effect (optional, but let's stick to clean clear for now)
        ctx.fillStyle = '#050505'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.save();
        
        // Screen Shake
        let sx = 0, sy = 0; 
        if (shake > 0) { 
            sx = (Math.random()-0.5)*shake; 
            sy = (Math.random()-0.5)*shake; 
            shake *= 0.9; 
            if(shake < 0.5) shake = 0; 
        }
        
        // Starfield Background (Parallax)
        drawStarfield(camX + sx, camY + sy);

        ctx.translate(-camX + sx, -camY + sy);

        drawParallaxGrid(); // Keep the grid but maybe make it subtler
        
        // Zones
        if (gameState.zones) {
            gameState.zones.forEach(z => {
                ctx.save();
                ctx.translate(z.x, z.y);
                ctx.fillStyle = z.color;
                
                if (z.type === 'BLACKHOLE') {
                    ctx.beginPath(); ctx.arc(0, 0, z.size, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = '#00bfff'; ctx.lineWidth = 2; ctx.stroke();
                    // Swirl effect
                    ctx.rotate(Date.now()/200);
                    ctx.beginPath(); 
                    for(let i=0; i<4; i++) {
                        ctx.moveTo(0,0); 
                        ctx.bezierCurveTo(20, 20, 40, 0, 60, 60); 
                    }
                    ctx.stroke();
                } else {
                    ctx.globalAlpha = 0.2;
                    ctx.beginPath(); ctx.arc(0, 0, z.size, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = z.color;
                    ctx.globalAlpha = 0.5;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.rotate(Date.now() / 1000);
                    ctx.beginPath(); ctx.arc(0, 0, z.size, 0, Math.PI*2); ctx.stroke();
                }
                ctx.restore();
            });
        }

        updateParticles();
        gameState.enemies.forEach(e => drawEnemy(e));
        for (let id in gameState.players) drawPlayer(gameState.players[id]);
        gameState.bullets.forEach(b => {
            // OPTIMIZATION: Skip drawing if off screen
            if (b.x < camX - 50 || b.x > camX + canvas.width + 50 || b.y < camY - 50 || b.y > camY + canvas.height + 50) return;

            // Bullet Trails
            if (Math.random() < 0.3) {
                particles.push({
                    x: b.x, y: b.y, 
                    vx: 0, vy: 0, 
                    life: 10, maxLife: 10, 
                    size: b.size, 
                    color: b.color, 
                    type: 'TRAIL'
                });
            }
            
            ctx.shadowBlur = 10; ctx.shadowColor = b.color; ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.size || 4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        });
        updateFloatingText();
        ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, gameState.map.w, gameState.map.h);
        ctx.restore();
    }

    function drawStarfield(cx, cy) {
        ctx.fillStyle = '#fff';
        stars.forEach(star => {
            // Parallax calculation
            let x = (star.x - cx * (1/star.z)) % canvas.width;
            let y = (star.y - cy * (1/star.z)) % canvas.height;
            
            // Wrap around
            if (x < 0) x += canvas.width;
            if (y < 0) y += canvas.height;
            
            const flicker = Math.random() > 0.9 ? 0.5 : 1;
            ctx.globalAlpha = (0.3 + Math.random() * 0.5) * flicker;
            ctx.beginPath(); 
            ctx.arc(x, y, star.size, 0, Math.PI*2); 
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    function drawParallaxGrid() {
        const time = Date.now() / 1000;
        
        // Layer 1 (Far)
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1; const g1 = 200;
        const sx1 = Math.floor((camX * 0.5) / g1) * g1; 
        const sy1 = Math.floor((camY * 0.5) / g1) * g1;
        ctx.save(); ctx.translate(camX * 0.5, camY * 0.5);
        // Reduced opacity for far grid
        ctx.globalAlpha = 0.3;
        for (let x = sx1 - g1*5; x < sx1 + canvas.width + g1*5; x += g1) { ctx.beginPath(); ctx.moveTo(x, sy1 - g1*5); ctx.lineTo(x, sy1 + canvas.height + g1*5); ctx.stroke(); }
        for (let y = sy1 - g1*5; y < sy1 + canvas.height + g1*5; y += g1) { ctx.beginPath(); ctx.moveTo(sx1 - g1*5, y); ctx.lineTo(sx1 + canvas.width + g1*5, y); ctx.stroke(); }
        ctx.restore();

        // Layer 2 (Near - Pulsing)
        // Dynamic tech grid
        const pulse = 0.05 + Math.sin(time) * 0.03;
        const g2 = 100;
        const sx2 = Math.floor(camX / g2) * g2, sy2 = Math.floor(camY / g2) * g2;
        
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse + 0.05})`;
        for (let x = sx2; x < camX + canvas.width + g2; x += g2) { 
            for (let y = sy2; y < camY + canvas.height + g2; y += g2) {
                 ctx.beginPath(); 
                 // Crosshair grid points
                 ctx.fillRect(x-2, y, 5, 1);
                 ctx.fillRect(x, y-2, 1, 5);
            }
        }
    }

    function drawPlayer(p) {
        if (p.hp <= 0) return;
        ctx.save(); ctx.translate(p.x, p.y);

        if (p.pendingLevelUp) {
            ctx.beginPath(); ctx.arc(0, 0, 300, 0, Math.PI * 2); ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 3;
            ctx.setLineDash([10, 10]); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = '#ffff00'; ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.fillText("SYSTEM UPGRADE...", 0, -p.size - 55);
        }
        if (p.shieldActive) {
            ctx.beginPath(); ctx.arc(0, 0, p.size + 15, 0, Math.PI * 2); ctx.strokeStyle = '#00ffff'; ctx.stroke();
        }
        if (p.stimTimer > 0) {
            ctx.beginPath(); ctx.arc(0, 0, p.size + 20, 0, Math.PI * 2); ctx.strokeStyle = '#00ff00'; ctx.setLineDash([5,5]); ctx.stroke(); ctx.setLineDash([]);
        }
        if (p.unstoppableTimer > 0) {
             ctx.beginPath(); ctx.arc(0, 0, p.size + 10, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 100, 0, 0.3)'; ctx.fill();
        }

        // REFINED PLAYER LABEL
        ctx.fillStyle = 'white'; ctx.textAlign = 'center';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(p.name || 'Unknown', 0, -p.size - 25);
        ctx.font = '10px monospace'; ctx.fillStyle = '#aaa';
        ctx.fillText(`LVL ${p.level} ${p.class}`, 0, -p.size - 12);

        ctx.rotate(p.angle);
        ctx.shadowBlur = 15; ctx.shadowColor = p.color; ctx.fillStyle = '#111'; ctx.strokeStyle = p.color; ctx.lineWidth = 2;
        if (p.invisible) ctx.globalAlpha = 0.3;
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2); ctx.strokeRect(-p.size, -p.size, p.size * 2, p.size * 2);
        
        ctx.fillStyle = p.color; ctx.globalAlpha = p.invisible ? 0.3 : 0.6;
        if(p.class==='ENGINEER'){ 
            ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, -10); ctx.lineTo(0, 10); ctx.fill();
            ctx.fillStyle = '#aaa'; ctx.fillRect(-5, -15, 10, 5); // Antenna
        }
        else if(p.class==='ASSAULT'){ ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(5, 0); ctx.lineTo(-10, 10); ctx.stroke(); }
        else if(p.class==='PYRO'){ ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill(); }
        else if(p.class==='LANCER'){ ctx.beginPath(); ctx.moveTo(p.size,0); ctx.lineTo(0, p.size/2); ctx.lineTo(0, -p.size/2); ctx.fill(); }
        else if(p.class==='GHOST'){ 
            ctx.beginPath(); ctx.moveTo(-5, -15); ctx.lineTo(5, -15); ctx.lineTo(0, 10); ctx.fill(); // Scythe-ish shape?
            ctx.beginPath(); ctx.arc(0, -10, 8, 0, Math.PI*2); ctx.stroke();
        }
        else if(p.class==='TITAN'){ ctx.strokeRect(-p.size+5, -p.size+5, p.size*2-10, p.size*2-10); }
        else if(p.class==='BERSERKER'){ 
            ctx.beginPath();
            for(let i=0; i<8; i++){ const a=(Math.PI*2/8)*i; ctx.lineTo(Math.cos(a)*p.size, Math.sin(a)*p.size); ctx.lineTo(Math.cos(a+0.4)*p.size*0.6, Math.sin(a+0.4)*p.size*0.6); } 
            ctx.closePath(); ctx.stroke(); 
        }
        else if(p.class==='CHRONOS'){ ctx.beginPath(); ctx.moveTo(-p.size/2, -p.size/2); ctx.lineTo(p.size/2, -p.size/2); ctx.lineTo(-p.size/2, p.size/2); ctx.lineTo(p.size/2, p.size/2); ctx.closePath(); ctx.stroke(); }
        else if(p.class==='ALCHEMIST'){
            ctx.beginPath(); ctx.arc(0, 5, 10, 0, Math.PI*2); ctx.fill();
            ctx.fillRect(-5, -15, 10, 15);
        }
        else if(p.class==='WARDEN'){
            ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(15, -10); ctx.lineTo(0, 15); ctx.closePath(); ctx.fill();
            ctx.strokeRect(-10, -15, 20, 5);
        }
        else if(p.class==='BARD'){
            ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(10, 10); ctx.lineTo(0, -10); ctx.fill();
            ctx.beginPath(); ctx.arc(0, -10, 5, 0, Math.PI*2); ctx.fill();
        }
        else if(p.class==='SHADE'){
            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 20; ctx.shadowColor = p.color;
        }
        else if(p.class==='JUGGERNAUT'){
            ctx.fillRect(-p.size+2, -p.size+2, p.size*2-4, p.size*2-4);
            ctx.strokeRect(-p.size-4, -p.size-4, p.size*2+8, p.size*2+8);
        }
        else if(p.class==='HEAVY'){
            ctx.fillRect(-p.size+5, -p.size+5, p.size*2-10, p.size*2-10); // Boxy
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, 0); ctx.stroke(); // Cannon
        }
        else if(p.class==='SNIPER'){
             ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(10, 0); ctx.stroke(); // Long gun
             ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
        }
        else if(p.class==='ARCANIST'){
            ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(12, 8); ctx.lineTo(-12, 8); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(12, -8); ctx.lineTo(-12, -8); ctx.closePath(); ctx.fill();
        }
        else if(p.class==='GAMBLER'){
            ctx.save(); ctx.rotate(Date.now()/500); ctx.fillRect(-10, -10, 20, 20); ctx.restore();
        }
        else if(p.class==='TRAPPER'){
            ctx.beginPath(); ctx.moveTo(-12, 12); ctx.lineTo(12, 12); ctx.lineTo(0, -12); ctx.fill();
        }
        else if(p.class==='NINJA'){
            ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(10, -5); ctx.lineTo(0, 10); ctx.fill();
            ctx.fillStyle = '#555'; ctx.fillRect(-10, -5, 20, 5); // Headband
        }
        else if(p.class==='DRUID'){
            ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#00ff00'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
        }
        else if(p.class==='VOLT'){
            ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.lineTo(5, 10); ctx.stroke();
        }
        else if(p.class==='COMMANDER'){
            ctx.fillRect(-10, -10, 20, 20); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI, true); ctx.fill();
        }
        else if(p.class==='HUNTRESS'){
            ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(10, 10); ctx.lineTo(0, 5); ctx.lineTo(-10, 10); ctx.fill();
        }
        else if(p.class==='NECROMANCER'){
            ctx.beginPath(); ctx.arc(0, -5, 8, 0, Math.PI*2); ctx.fill(); // Skull head
            ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(8, 10); ctx.lineTo(0, 5); ctx.fill(); // Jaw
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-3, -5, 2, 0, Math.PI*2); ctx.arc(3, -5, 2, 0, Math.PI*2); ctx.fill();
        }
        else if(p.class==='BEAMER'){
            ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, -10); ctx.lineTo(0, 15); ctx.fill();
            ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
        }
        else if(p.class==='GUNSLINGER'){
            ctx.fillRect(-8, -5, 16, 15);
            ctx.fillStyle = '#654321'; ctx.fillRect(-12, -12, 24, 4); ctx.fillRect(-8, -16, 16, 4); // Hat
        }
        else if(p.class==='SHAMAN'){
            ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(10, 10); ctx.lineTo(0, -15); ctx.fill();
            ctx.strokeStyle = '#00ff00'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
        }
        else if(p.class==='PLAGUE'){
             ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = '#00ff00'; for(let i=0; i<3; i++) { ctx.beginPath(); ctx.arc((Math.random()-0.5)*15, (Math.random()-0.5)*15, 3, 0, Math.PI*2); ctx.fill(); }
        }
        else if(p.class==='RONIN'){
            ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(5, 0); ctx.lineTo(0, 15); ctx.lineTo(-5, 0); ctx.fill();
            ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(0,15); ctx.stroke();
        }
        else if(p.class==='HIVE'){
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(0, -4, 10, Math.PI, 0); ctx.fill(); // Shell
        }
        else if(p.class==='GRAVITY'){
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle='#4B0082'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.stroke();
        }
        else if(p.class==='MARINE'){
            ctx.fillRect(-10, -10, 20, 20);
            ctx.fillStyle='#000'; ctx.fillRect(-8, -5, 16, 4); // Visor
        }
        else if(p.class==='PIRATE'){
            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle='#ff0000'; ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(10, -5); ctx.lineTo(0, -15); ctx.fill(); // Bandana
        }
        
        ctx.globalAlpha = 1; ctx.restore();

        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.turretAngle);
        ctx.fillStyle = p.color; if(p.invisible) ctx.globalAlpha=0.3;
        ctx.fillRect(0, -4, p.size * 1.6, 8);
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.restore(); ctx.shadowBlur = 0;
    }

    function drawEnemy(e) {
        ctx.save(); ctx.translate(e.x, e.y);
        if(e.type==='BOSS') ctx.rotate(Date.now()/1000); else ctx.rotate(e.angle);
        
        let color = e.color; 
        if(e.slowed) color = '#00ffff';
        if(e.acidStacks > 0) color = '#00ff00';
        if(e.fearTimer > 0) color = '#4b0082'; // Fear color
        
        if (e.invisible) ctx.globalAlpha = 0.2;
        
        // Miniboss Visuals
        if (e.isMiniboss) {
            ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
            ctx.strokeStyle = '#ffd700'; // Gold outline
        } else {
            ctx.shadowColor = color; ctx.shadowBlur = 10;
            ctx.strokeStyle = color;
        }
        
        ctx.lineWidth = 2; ctx.fillStyle = '#0a0000';
        
        ctx.beginPath();
        if (e.type === 'KAMIKAZE') { ctx.moveTo(e.size, 0); ctx.lineTo(-e.size, e.size / 1.5); ctx.lineTo(-e.size, -e.size / 1.5); ctx.closePath(); }
        else if (e.type === 'TANK') { ctx.rect(-e.size, -e.size, e.size*2, e.size*2); }
        else if (e.type === 'GUNNER') { ctx.moveTo(-e.size, -e.size); ctx.lineTo(e.size, e.size); ctx.moveTo(e.size, -e.size); ctx.lineTo(-e.size, e.size); }
        else if (e.type === 'SWARMER') { ctx.arc(0,0, e.size, 0, Math.PI*2); }
        else if (e.type === 'ORBITER') { ctx.rect(-e.size/2, -e.size/2, e.size, e.size); ctx.arc(0,0,e.size,0,Math.PI*2); }
        else if (e.type === 'STALKER') { ctx.moveTo(e.size, 0); ctx.lineTo(-e.size, e.size/2); ctx.lineTo(-e.size, -e.size/2); ctx.closePath(); }
        else if (e.type === 'ARTILLERY') { ctx.rect(-e.size, -e.size, e.size*2, e.size*2); ctx.moveTo(0,0); ctx.lineTo(e.size*1.5, 0); }
        else if (e.type === 'SPLITTER') { ctx.arc(0,0, e.size, 0, Math.PI*2); ctx.moveTo(-e.size, 0); ctx.lineTo(e.size, 0); }
        else if (e.type === 'MITE') { ctx.arc(0,0, e.size, 0, Math.PI*2); }
        else if (e.type === 'MENDER') { ctx.rect(-e.size/2, -e.size, e.size, e.size*2); ctx.rect(-e.size, -e.size/2, e.size*2, e.size); } // Plus sign
        else if (e.type === 'RAILGUNNER') { ctx.moveTo(e.size*1.5, 0); ctx.lineTo(-e.size, e.size/2); ctx.lineTo(-e.size, -e.size/2); ctx.closePath(); }
        else if (e.type === 'HUNTER') { ctx.moveTo(e.size, 0); ctx.lineTo(-e.size, e.size); ctx.lineTo(-e.size/2, 0); ctx.lineTo(-e.size, -e.size); ctx.closePath(); }
        else if (e.type === 'NOVA') { ctx.arc(0,0,e.size,0,Math.PI*2); ctx.moveTo(0, -e.size); ctx.lineTo(0, e.size); ctx.moveTo(-e.size, 0); ctx.lineTo(e.size, 0); }
        else if (e.type === 'BOSS') { for(let i=0; i<16; i++){ const r=(i%2===0)?e.size:e.size*0.7; const a=(Math.PI*i)/8; ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r); } ctx.closePath(); }
        else { ctx.moveTo(e.size, 0); ctx.lineTo(0, e.size); ctx.lineTo(-e.size, 0); ctx.lineTo(0, -e.size); ctx.closePath(); }
        ctx.fill(); ctx.stroke();
        
        ctx.rotate(e.type==='BOSS'?-(Date.now()/1000):-e.angle);
        ctx.fillStyle='#330000'; ctx.fillRect(-e.size, -e.size-15, e.size*2, 4);
        ctx.fillStyle=color; ctx.fillRect(-e.size, -e.size-15, e.size*2*(e.hp/e.maxHp), 4);
        
        if (e.isMiniboss) {
            ctx.fillStyle = '#ffd700'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
            ctx.fillText("ELITE", 0, -e.size - 18);
        }

        ctx.restore(); ctx.shadowBlur = 0;
    }

    function spawnExplosion(x, y, size, color) { 
        for(let i=0; i<16; i++) {
            const speed = (Math.random() * 2 + 1) * (size / 10);
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x, y, 
                vx: Math.cos(angle) * speed, 
                vy: Math.sin(angle) * speed, 
                life: 40 + Math.random() * 20, 
                maxLife: 60, 
                size: Math.random() * size/2 + 2, 
                color, 
                type: 'DEBRIS'
            }); 
        }
        // Add flash
        particles.push({x, y, life: 5, maxLife: 5, size: size * 2, color: 'rgba(255,255,255,0.8)', type: 'FLASH'});
    }

    function spawnShockwave(x, y, color='#fff') { particles.push({x, y, type:'SHOCKWAVE', life:25, maxLife:25, size:10, color}); }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i]; p.life--; 
            if(p.life<=0){particles.splice(i,1);continue;}
            
            // OPTIMIZATION: Skip drawing if off screen
            if (p.x < camX - 100 || p.x > camX + canvas.width + 100 || p.y < camY - 100 || p.y > camY + canvas.height + 100) continue;

            if(p.type==='SHOCKWAVE'){ 
                p.size+=15; 
                ctx.save();
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); 
                ctx.strokeStyle=p.color; 
                ctx.globalAlpha=p.life/p.maxLife; 
                ctx.lineWidth=4; ctx.stroke(); 
                ctx.restore();
            } else if (p.type === 'FLASH') {
                 ctx.save();
                 ctx.globalAlpha = p.life / p.maxLife;
                 ctx.fillStyle = p.color;
                 ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
                 ctx.restore();
            } else if (p.type === 'TRAIL') {
                 ctx.fillStyle = p.color;
                 ctx.globalAlpha = p.life / p.maxLife * 0.5;
                 ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
                 ctx.globalAlpha = 1;
            } else { 
                // Debris physics
                p.x+=p.vx; p.y+=p.vy; 
                p.vx*=0.92; p.vy*=0.92; // Drag
                p.size *= 0.95; // Shrink
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.life * 0.2);
                ctx.fillStyle=p.color; 
                ctx.globalAlpha=p.life/p.maxLife; 
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size); 
                ctx.restore();
            }
        }
    }

    function spawnText(msg, x, y, color, size=20) { 
        floatingTexts.push({
            msg, x, y, color, size, 
            life: 80, 
            vx: (Math.random() - 0.5) * 2, 
            vy: -2 - Math.random() * 2 
        }); 
    }

    function updateFloatingText() {
        ctx.textAlign="center"; 
        for(let i=floatingTexts.length-1; i>=0; i--){ 
            let t=floatingTexts[i]; 
            t.life--; 
            t.x += t.vx; 
            t.y += t.vy; 
            t.vy += 0.05; // Gravity
            
            if(t.life<=0){floatingTexts.splice(i,1);continue;}
            
            ctx.save(); 
            const scale = Math.min(1, t.life/10) * (1 + Math.max(0, (60-t.life)/60)); // Pop in and fade out
            ctx.translate(t.x, t.y);
            ctx.scale(scale, scale);
            ctx.globalAlpha=Math.min(1, t.life/20); 
            
            ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
            ctx.fillStyle=t.color; 
            ctx.font=`bold ${t.size}px monospace`; 
            ctx.fillText(t.msg, 0, 0); 
            ctx.restore(); 
        }
    }
    draw();
}
