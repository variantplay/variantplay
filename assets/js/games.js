// --- Audio Context Setup ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let bgmOsc = null;
let bgmGain = null;
let bgmInterval = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if(audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBackgroundMusic() {
    if (!audioCtx || bgmOsc) return;
    
    bgmOsc = audioCtx.createOscillator();
    bgmGain = audioCtx.createGain();
    
    bgmOsc.type = 'triangle';
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    bgmOsc.connect(filter);
    filter.connect(bgmGain);
    bgmGain.connect(audioCtx.destination);
    
    bgmGain.gain.value = 0;
    bgmOsc.start();

    // Chill Major Pentatonic scale (C, D, E, G, A)
    const notes = [261.63, 293.66, 329.63, 392.00, 329.63, 440.00, 392.00, 523.25];
    let step = 0;
    
    bgmInterval = setInterval(() => {
        if(audioCtx.state === 'running') {
            const now = audioCtx.currentTime;
            bgmOsc.frequency.setValueAtTime(notes[step % notes.length], now);
            bgmGain.gain.cancelScheduledValues(now);
            bgmGain.gain.setValueAtTime(0, now);
            bgmGain.gain.linearRampToValueAtTime(0.04, now + 0.1);
            bgmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            step++;
        }
    }, 600); // Slower, chill tempo (~100 BPM)
}

function stopBackgroundMusic() {
    if (bgmOsc) {
        bgmOsc.stop();
        bgmOsc.disconnect();
        bgmOsc = null;
    }
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
}

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'blip') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
        osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
        
        // noise approximation
        const noiseOsc = audioCtx.createOscillator();
        noiseOsc.type = 'square';
        noiseOsc.frequency.setValueAtTime(100, now);
        noiseOsc.frequency.linearRampToValueAtTime(1000, now + 0.5);
        
        noiseOsc.connect(gainNode);
        noiseOsc.start(now);
        noiseOsc.stop(now + 0.5);
        
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.1); // E6
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'hum') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.4, now + 1);
        osc.start(now);
        return { osc, gainNode }; // Return to allow stopping
    } else if (type === 'ping') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// --- Visual FX ---
function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-score';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.background = color;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${Math.random() * 8 + 4}px`;
        particle.style.height = particle.style.width;
        
        const tx = (Math.random() - 0.5) * 200;
        const ty = (Math.random() - 0.5) * 200;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
    }
}

function createShockwave(el) {
    const rect = el.getBoundingClientRect();
    const wave = document.createElement('div');
    wave.className = 'shockwave';
    wave.style.left = `${rect.left + rect.width/2}px`;
    wave.style.top = `${rect.top + rect.height/2}px`;
    document.body.appendChild(wave);
    setTimeout(() => wave.remove(), 500);
}

function triggerShake(el) {
    el.classList.remove('screen-shake');
    void el.offsetWidth; // trigger reflow
    el.classList.add('screen-shake');
}

// --- Formatting ---
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- Game Overlay UI Elements ---
const gameOverlay = document.getElementById('game-overlay');
const activeGameTitle = document.getElementById('active-game-title');
const closeGameBtn = gameOverlay.querySelector('.close-game');
const gameCanvasArea = document.getElementById('game-canvas-area');

const globalTimerEl = document.getElementById('global-timer');
const globalScoreEl = document.getElementById('global-score');
const sidebarBalanceEl = document.getElementById('sidebar-balance');
const sidebarCustomEl = document.getElementById('game-sidebar-custom');

let currentGame = null;

// --- Open/Close Logic ---
document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.play-game-trigger');
    if (btn) {
        e.preventDefault();
        const gameName = btn.getAttribute('data-game');
        initAudio(); // Required due to browser autoplay policies
        openGameOverlay(gameName);
    }
});

function openGameOverlay(gameName) {
    activeGameTitle.textContent = gameName;
    sidebarBalanceEl.textContent = window.userState.coins || 0;
    globalTimerEl.textContent = "2:00";
    globalScoreEl.textContent = "0";
    sidebarCustomEl.innerHTML = '';
    
    gameOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    gameCanvasArea.innerHTML = ''; 
    if (gameName === 'Neon Rush') {
        initNeonRushRacing();
    } else if (gameName === 'Cyber Match') {
        initCyberMatch();
    } else if (gameName === 'Galactic Strike') {
        initGalacticStrike();
    } else {
        gameCanvasArea.innerHTML = '<h2 style="color:var(--text-muted);">Game coming soon!</h2>';
    }
}

function closeGameOverlay() {
    if (currentGame && currentGame.isPlaying()) {
        // Force the game to end and trigger the ad wall instead of closing
        currentGame.endGame();
        window.showToast("Game ended early! Submitting score...", "info");
        return; 
    }

    gameOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    if (currentGame && currentGame.cleanup) {
        currentGame.cleanup();
    }
    currentGame = null;
}

closeGameBtn.addEventListener('click', closeGameOverlay);

// --- Monetization & Ad-Wall Logic ---
const adModal = document.getElementById('ad-modal');
const adCountdownSpan = document.getElementById('ad-countdown');
const adProgressBar = document.getElementById('ad-progress-bar');
const claimRewardBtn = document.getElementById('claim-reward-btn');
const adTimerText = document.getElementById('ad-timer-text');
const closeAdBtn = document.getElementById('close-ad-btn');

let adTimerInterval;
let currentRewardAmount = 0;

function triggerAdWall(amount) {
    if (amount <= 0) {
        // No reward, just close game if needed or allow restart
        window.showToast("Time's up! No reward this time.", "info");
        return;
    }
    currentRewardAmount = amount;
    
    // Reset Ad UI
    claimRewardBtn.style.display = 'none';
    adTimerText.style.display = 'block';
    adCountdownSpan.textContent = '5';
    adProgressBar.style.width = '0%';
    adProgressBar.style.transition = 'none';
    
    adModal.classList.add('active');
    
    const adVideo = document.getElementById('ad-video');
    if (adVideo) {
        adVideo.currentTime = 0;
        adVideo.play().catch(e => console.log("Autoplay prevented:", e));
    }
    
    const adVideoContainer = document.getElementById('ad-video-container');
    if (adVideoContainer) {
        adVideoContainer.style.cursor = 'pointer';
        // Remove old listener if exists to prevent multiple triggers
        adVideoContainer.onclick = () => {
            window.open('https://www.google.com/search?q=gaming+sponsors', '_blank');
        };
    }
    
    // Start animation loop
    setTimeout(() => {
        adProgressBar.style.transition = 'width 5s linear';
        adProgressBar.style.width = '100%';
    }, 50);

    let seconds = 5;
    adTimerInterval = setInterval(() => {
        seconds--;
        adCountdownSpan.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(adTimerInterval);
            adTimerText.style.display = 'none';
            claimRewardBtn.style.display = 'inline-block';
            playSound('success');
        }
    }, 1000);
}

closeAdBtn.addEventListener('click', () => {
    clearInterval(adTimerInterval);
    const adVideo = document.getElementById('ad-video');
    if (adVideo) adVideo.pause();
    
    adModal.classList.remove('active');
    if (claimRewardBtn.style.display !== 'inline-block') {
        window.showToast("You closed the ad early. Reward forfeited!", "warning");
    }
});

claimRewardBtn.addEventListener('click', () => {
    const adVideo = document.getElementById('ad-video');
    if (adVideo) adVideo.pause();
    
    adModal.classList.remove('active');
    
    if (!window.userState.isLoggedIn) {
        // Guest User Logic
        window.userState.pendingReward = currentRewardAmount;
        closeGameOverlay();
        window.showToast("Sign up to save your score and claim your coins!", "info");
        const authModal = document.getElementById('auth-modal');
        if(authModal) {
            authModal.classList.add('active');
            setTimeout(() => document.getElementById('auth-email').focus(), 100);
        }
    } else {
        // Logged in user logic
        rewardCoins(currentRewardAmount);
    }
});

// --- Firebase Reward Logic ---
async function rewardCoins(amount) {
    if (!window.userState.isLoggedIn || !window.userState.uid) return;
    
    try {
        const userRef = window.db.collection("users").doc(window.userState.uid);
        await userRef.update({
            coins: firebase.firestore.FieldValue.increment(amount),
            gamesPlayed: firebase.firestore.FieldValue.increment(1)
        });
        window.showToast(`You successfully claimed ${amount} coins!`, 'success');
        sidebarBalanceEl.textContent = window.userState.coins + amount; // optimistic UI update
    } catch (e) {
        console.error("Error rewarding coins: ", e);
        window.showToast('Error saving progress.', 'warning');
    }
}

// ==========================================
// GAME 1: Click Speed Test (Neon Rush)
// ==========================================
function initNeonRushRacing() {
    gameCanvasArea.innerHTML = `
        <div style="position:relative; width:100%; height:100%; display:flex; justify-content:center; align-items:center; background:#050510; border-radius:12px; overflow:hidden;">
            <div id="racing-canvas-container" style="width:100%; height:100%; cursor:crosshair;"></div>
            
            <div id="racing-ui" style="position:absolute; inset:0; pointer-events:none; z-index:5;">
                <div style="position:absolute; top:15px; left:15px; color:#fff; font-size:24px; font-weight:bold; text-shadow:0 0 10px #00ff88;" id="neon-score-display">Score: 0</div>
                <div style="position:absolute; top:15px; right:15px; text-align:right;">
                    <div style="color:#fff; font-size:16px; font-weight:bold; margin-bottom:5px;">FUEL</div>
                    <div style="width:120px; height:20px; border:2px solid #fff; background:rgba(255,255,255,0.2);">
                        <div id="neon-fuel-bar" style="width:100%; height:100%; background:#00e5ff; transition: width 0.1s linear;"></div>
                    </div>
                </div>
                <div id="neon-powerup-text" style="position:absolute; top:50px; left:50%; transform:translateX(-50%); color:#a020f0; font-size:32px; font-weight:bold; text-shadow:0 0 20px #a020f0;"></div>
            </div>

            <div id="racing-start-overlay" style="position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(5,5,16,0.85); z-index:10;">
                <h2 style="color:var(--accent-cyan); margin-bottom:1rem; text-shadow:0 0 15px var(--accent-cyan); font-size: 2.5rem;">Neon Rush 3D</h2>
                <div style="background:rgba(0,0,0,0.5); padding:1.5rem; border-radius:12px; border:1px solid rgba(0,229,255,0.2); margin-bottom:2rem; text-align:left; max-width:85%;">
                    <h4 style="color:#fff; margin-bottom:1rem; text-align:center; font-size:1.2rem;">How to Play</h4>
                    <ul style="color:#ccc; font-size:0.95rem; line-height:1.6; padding-left:1.2rem; margin:0;">
                        <li style="margin-bottom:0.5rem;"><strong>Controls:</strong> Move your mouse left and right to steer the 3D car.</li>
                        <li style="margin-bottom:0.5rem;"><strong>Obstacles:</strong> Dodge the <span style="color:var(--accent-pink);">red blocks</span>. Hitting one ends the game!</li>
                        <li style="margin-bottom:0.5rem;"><strong>Fuel:</strong> Run over <span style="color:#FFD700;">yellow floating cylinders</span> to refill your fuel.</li>
                        <li style="margin-bottom:0.5rem;"><strong>Points:</strong> Run over <span style="color:#00ff88;">green blocks ($)</span> for points.</li>
                        <li><strong>Power-up:</strong> Collect <span style="color:#a020f0;">purple gems</span> for 10 seconds of Ghost Mode (pass through red blocks)!</li>
                    </ul>
                </div>
                <button id="racing-start-btn" class="btn btn-primary glow-btn btn-large">START ENGINE</button>
            </div>
        </div>
    `;

    const container = document.getElementById('racing-canvas-container');
    const startOverlay = document.getElementById('racing-start-overlay');
    const startBtn = document.getElementById('racing-start-btn');
    
    let scoreDisplay = document.getElementById('neon-score-display');
    let fuelBar = document.getElementById('neon-fuel-bar');
    let powerupText = document.getElementById('neon-powerup-text');
    
    let playing = false;
    let score = 0;
    let fuel = 100;
    const maxFuel = 100;
    let gameLoopReq = null;
    let lastTime = 0;
    let speedMultiplier = 1;
    let distance = 0;
    let engineSound = null;
    let invincibilityTimer = 0;
    
    // THREE.JS SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 300, 1500);
    
    let initWidth = container.clientWidth || 800;
    let initHeight = container.clientHeight || 600;
    
    const camera = new THREE.PerspectiveCamera(75, initWidth / initHeight, 0.1, 1000);
    // 3rd person chase cam
    camera.position.set(0, 20, 60); 
    camera.lookAt(0, 0, -20);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(initWidth, initHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    const resizeObserver = new ResizeObserver(() => {
        if(container.clientWidth > 0 && container.clientHeight > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
    resizeObserver.observe(container);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Bright daylight
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2); // Warm sun
    sunLight.position.set(200, 400, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 1500;
    sunLight.shadow.camera.left = -300;
    sunLight.shadow.camera.right = 300;
    sunLight.shadow.camera.top = 500;
    sunLight.shadow.camera.bottom = -500;
    scene.add(sunLight);
    
    function createTextTexture(text, bgColor, textColor) {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const ctx = c.getContext('2d');
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 80px sans-serif';
        ctx.fillText(text, 64, 64);
        return new THREE.CanvasTexture(c);
    }
    const texDollar = createTextTexture('$', '#00ff88', '#ffffff');
    const texFuel = createTextTexture('F', '#FFD700', '#000000');

    // ENVIRONMENT
    // Textured Road
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 512;
    roadCanvas.height = 512;
    const roadCtx = roadCanvas.getContext('2d');
    roadCtx.fillStyle = '#111111';
    roadCtx.fillRect(0, 0, 512, 512);
    roadCtx.fillStyle = '#ffffff';
    for(let i=0; i<512; i+=64) {
        roadCtx.fillRect(248, i+16, 16, 32);
    }
    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(4, 50);

    const roadGeo = new THREE.PlaneGeometry(500, 2000);
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, color: 0xaaaaaa, roughness: 0.9, metalness: 0.1 });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = -2;
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);
    
    // MOUNTAINS (Daytime)
    const mountGroup = new THREE.Group();
    mountGroup.position.set(0, -2, -900);
    
    const m1 = new THREE.Mesh(new THREE.ConeGeometry(300, 400, 4), new THREE.MeshStandardMaterial({color: 0x224422, roughness: 1.0, metalness: 0.0}));
    m1.position.set(-250, 200, 0);
    m1.receiveShadow = true;
    m1.castShadow = true;
    mountGroup.add(m1);
    
    const m2 = new THREE.Mesh(new THREE.ConeGeometry(400, 600, 4), new THREE.MeshStandardMaterial({color: 0x335533, roughness: 1.0, metalness: 0.0}));
    m2.position.set(200, 300, -100);
    m2.receiveShadow = true;
    m2.castShadow = true;
    mountGroup.add(m2);
    
    const m3 = new THREE.Mesh(new THREE.ConeGeometry(200, 250, 4), new THREE.MeshStandardMaterial({color: 0x113311, roughness: 1.0, metalness: 0.0}));
    m3.position.set(0, 125, 100);
    m3.receiveShadow = true;
    m3.castShadow = true;
    mountGroup.add(m3);
    
    scene.add(mountGroup);
    
    // PLAYER CAR
    const carGroup = new THREE.Group();
    carGroup.position.set(0, 0, 0);
    
    const bodyGeo = new THREE.SphereGeometry(4, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.2, metalness: 0.8 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.scale.set(1, 0.7, 2.5); // Flattened and stretched to look like a sports car body
    bodyMesh.position.y = 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    carGroup.add(bodyMesh);
    
    const cabinGeo = new THREE.SphereGeometry(3.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 5.5, -2);
    cabinMesh.castShadow = true;
    cabinMesh.receiveShadow = true;
    carGroup.add(cabinMesh);
    
    scene.add(carGroup);
    
    // GAME ENTITIES
    let objects = [];
    const baseSpeed = 200; 
    
    let spawnTimer = 0;
    let treeSpawnTimer = 0;
    
    // Input
    let targetX = 0;
    
    container.addEventListener('mousemove', (e) => {
        if (!playing) return;
        const rect = container.getBoundingClientRect();
        let normalizedX = (e.clientX - rect.left) / rect.width;
        targetX = (normalizedX - 0.5) * 120;
        if (targetX < -45) targetX = -45;
        if (targetX > 45) targetX = 45;
    });

    container.addEventListener('touchmove', (e) => {
        if (!playing) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        let normalizedX = (touch.clientX - rect.left) / rect.width;
        targetX = (normalizedX - 0.5) * 120;
        if (targetX < -45) targetX = -45;
        if (targetX > 45) targetX = 45;
    }, { passive: false });

    currentGame = {
        cleanup: () => {
            playing = false;
            cancelAnimationFrame(gameLoopReq);
            resizeObserver.disconnect();
            stopBackgroundMusic();
            if (engineSound) { engineSound.osc.stop(); engineSound = null; }
            renderer.dispose();
        },
        isPlaying: () => playing,
        getScore: () => score,
        endGame: endGame
    };

    startBtn.addEventListener('click', () => {
        initAudio();
        startOverlay.style.display = 'none';
        
        playing = true;
        score = 0;
        distance = 0;
        fuel = maxFuel;
        speedMultiplier = 1;
        invincibilityTimer = 0;
        lastTime = performance.now();
        
        objects.forEach(obj => scene.remove(obj.mesh));
        objects = [];
        
        scoreDisplay.textContent = `Score: ${score}`;
        globalScoreEl.textContent = score;
        fuelBar.style.width = '100%';
        fuelBar.style.background = '#00e5ff';
        powerupText.textContent = '';
        
        if (engineSound) { engineSound.osc.stop(); engineSound = null; }
        stopBackgroundMusic();
        playBackgroundMusic();
        playSound('ping');
        
        gameLoopReq = requestAnimationFrame(gameLoop);
    });
    
    function spawnObject() {
        const rand = Math.random();
        let type = 'obstacle';
        let geo, mat, color;
        let yPos = 2;
        let colliderSize = 10;
        let scale = {x: 1, y: 1, z: 1};
        
        if (rand < 0.25) {
            type = 'obstacle';
            geo = new THREE.BoxGeometry(12, 12, 12);
            mat = new THREE.MeshStandardMaterial({ color: 0xff0055, roughness: 0.3, metalness: 0.7 });
            yPos = 6;
            colliderSize = 12;
        } else if (rand < 0.55) {
            type = 'fuel';
            geo = new THREE.CylinderGeometry(4, 4, 10, 16);
            mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texFuel, roughness: 0.4, metalness: 0.6 });
            yPos = 5;
            colliderSize = 8;
        } else if (rand < 0.95) {
            type = 'point';
            geo = new THREE.BoxGeometry(8, 8, 8);
            mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texDollar, roughness: 0.5, metalness: 0.3 });
            yPos = 4;
            colliderSize = 8;
        } else {
            type = 'powerup';
            geo = new THREE.DodecahedronGeometry(6);
            mat = new THREE.MeshStandardMaterial({ color: 0xa020f0, roughness: 0.1, metalness: 0.9, emissive: 0x330055 });
            yPos = 6;
            colliderSize = 10;
        }
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * 90, yPos, -600);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        scene.add(mesh);
        objects.push({ type, mesh, colliderSize, hit: false, rotationSpeed: (Math.random()-0.5)*5 });
    }

    function createTreeMesh(xPos) {
        const treeGroup = new THREE.Group();
        
        const trunkGeo = new THREE.CylinderGeometry(2, 3, 20);
        const trunkMat = new THREE.MeshStandardMaterial({color: 0x4a2f1d, roughness: 0.9, metalness: 0.0});
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 10;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);
        
        const leavesGeo = new THREE.ConeGeometry(15, 40, 5);
        const leavesMat = new THREE.MeshStandardMaterial({color: 0x00aa33, roughness: 0.8, metalness: 0.1});
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 35;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        treeGroup.add(leaves);
        
        treeGroup.position.set(xPos, -2, -800);
        treeGroup.scale.set(0.01, 0.01, 0.01);
        scene.add(treeGroup);
        return treeGroup;
    }

    function spawnTree() {
        const xDist = 60 + Math.random() * 60; // 60 to 120 units away from center
        const leftTree = createTreeMesh(-xDist);
        const rightTree = createTreeMesh(xDist);
        
        objects.push({ type: 'tree', mesh: leftTree, colliderSize: 0, hit: true, rotationSpeed: 0 });
        objects.push({ type: 'tree', mesh: rightTree, colliderSize: 0, hit: true, rotationSpeed: 0 });
    }

    function gameLoop(timestamp) {
        if (!playing) return;
        
        let dt = (timestamp - lastTime) / 1000;
        if(dt > 0.1) dt = 0.1;
        lastTime = timestamp;
        
        if (invincibilityTimer > 0) {
            invincibilityTimer -= dt;
            powerupText.textContent = `GHOST: ${Math.ceil(invincibilityTimer)}s`;
            bodyMat.color.setHex(0xa020f0);
            
            if (invincibilityTimer <= 0) {
                powerupText.textContent = '';
                bodyMat.color.setHex(0x00e5ff);
                playSound('fail'); 
            }
        }
        
        const currentSpeed = baseSpeed * speedMultiplier;
        const travelDist = currentSpeed * dt;
        distance += travelDist;
        
        roadTex.offset.y -= travelDist * 0.005;
        
        fuel -= 4 * dt * speedMultiplier; 
        if (fuel <= 0) {
            fuel = 0;
            updateFuelUI();
            endGame("Out of Fuel!");
            return;
        }
        updateFuelUI();
        
        speedMultiplier += 0.015 * dt; 
        
        carGroup.position.x += (targetX - carGroup.position.x) * 10 * dt;
        carGroup.rotation.z = (carGroup.position.x - targetX) * 0.01;
        carGroup.rotation.y = (targetX - carGroup.position.x) * 0.005;

        spawnTimer -= travelDist;
        if (spawnTimer <= 0) {
            spawnObject();
            spawnTimer = 150 + Math.random() * 100;
        }
        
        treeSpawnTimer -= travelDist;
        if (treeSpawnTimer <= 0) {
            spawnTree(); // Spawns both left and right simultaneously
            treeSpawnTimer = 80 + Math.random() * 80;
        }
        
        const carBox = new THREE.Box3().setFromObject(carGroup);
        carBox.expandByScalar(-2);
        
        for (let i = objects.length - 1; i >= 0; i--) {
            let obj = objects[i];
            
            obj.mesh.position.z += travelDist;
            
            if (obj.type === 'tree') {
                let scaleVal = (obj.mesh.position.z + 800) / 300;
                if (scaleVal > 1) scaleVal = 1;
                if (scaleVal < 0.01) scaleVal = 0.01;
                obj.mesh.scale.set(scaleVal, scaleVal, scaleVal);
            }
            
            if (obj.type === 'fuel' || obj.type === 'point' || obj.type === 'powerup') {
                obj.mesh.rotation.x += obj.rotationSpeed * dt;
                obj.mesh.rotation.y += obj.rotationSpeed * dt;
            }
            
            if (!obj.hit && obj.mesh.position.z > -20 && obj.mesh.position.z < 20) {
                const objBox = new THREE.Box3().setFromObject(obj.mesh);
                objBox.expandByScalar(-1);
                
                if (carBox.intersectsBox(objBox)) {
                    obj.hit = true;
                    
                    if (obj.type === 'obstacle') {
                        if (invincibilityTimer <= 0) {
                            playSound('crash');
                            scene.remove(obj.mesh);
                            endGame("Crashed!");
                            return;
                        } else {
                            scene.remove(obj.mesh);
                            playSound('click');
                        }
                    } 
                    else if (obj.type === 'fuel') {
                        fuel = Math.min(maxFuel, fuel + 30);
                        playSound('click');
                        scene.remove(obj.mesh);
                    }
                    else if (obj.type === 'point') {
                        score += 1;
                        globalScoreEl.textContent = score;
                        scoreDisplay.textContent = `Score: ${score}`;
                        playSound('coin');
                        scene.remove(obj.mesh);
                    }
                    else if (obj.type === 'powerup') {
                        invincibilityTimer = 10.0;
                        playSound('success');
                        scene.remove(obj.mesh);
                    }
                }
            }
            
            if (obj.mesh.position.z > 100 || obj.hit) {
                scene.remove(obj.mesh);
                objects.splice(i, 1);
            }
        }
        
        renderer.render(scene, camera);
        gameLoopReq = requestAnimationFrame(gameLoop);
    }
    
    function updateFuelUI() {
        fuelBar.style.width = `${fuel}%`;
        if (fuel < 20) fuelBar.style.background = '#ff0055';
        else fuelBar.style.background = '#00e5ff';
    }

    function endGame(reason) {
        if (!playing) return;
        playing = false;
        cancelAnimationFrame(gameLoopReq);
        stopBackgroundMusic();
        if (engineSound) { engineSound.osc.stop(); engineSound = null; }
        
        let coinsWon = score; 
        if (coinsWon < 1) coinsWon = 1; 
        
        startOverlay.innerHTML = `
            <h2 style="color:var(--accent-pink); margin-bottom:1rem; text-shadow:0 0 15px var(--accent-pink); font-size:2.5rem;">${reason}</h2>
            <h3 style="color:#fff; margin-bottom:2rem; font-size:1.5rem;">Final Score: ${score}</h3>
            <button id="racing-restart-btn" class="btn btn-primary glow-btn btn-large" style="margin-bottom: 1rem;">PLAY AGAIN</button>
            <p style="color:var(--text-muted); font-size:0.9rem;">Submitting score shortly...</p>
        `;
        startOverlay.style.display = 'flex';
        
        document.getElementById('racing-restart-btn').addEventListener('click', () => {
            startOverlay.innerHTML = `
                <h2 style="color:var(--accent-cyan); margin-bottom:1rem; text-shadow:0 0 15px var(--accent-cyan); font-size: 2.5rem;">Neon Rush 3D</h2>
                <div style="background:rgba(0,0,0,0.5); padding:1.5rem; border-radius:12px; border:1px solid rgba(0,229,255,0.2); margin-bottom:2rem; text-align:left; max-width:85%;">
                    <h4 style="color:#fff; margin-bottom:1rem; text-align:center; font-size:1.2rem;">How to Play</h4>
                    <ul style="color:#ccc; font-size:0.95rem; line-height:1.6; padding-left:1.2rem; margin:0;">
                        <li style="margin-bottom:0.5rem;"><strong>Controls:</strong> Move your mouse left and right to steer the 3D car.</li>
                        <li style="margin-bottom:0.5rem;"><strong>Obstacles:</strong> Dodge the <span style="color:var(--accent-pink);">red blocks</span>. Hitting one ends the game!</li>
                        <li style="margin-bottom:0.5rem;"><strong>Fuel:</strong> Run over <span style="color:#FFD700;">yellow floating cylinders</span> to refill your fuel.</li>
                        <li style="margin-bottom:0.5rem;"><strong>Points:</strong> Run over <span style="color:#00ff88;">green blocks ($)</span> for points.</li>
                        <li><strong>Power-up:</strong> Collect <span style="color:#a020f0;">purple gems</span> for 10 seconds of Ghost Mode (pass through red blocks)!</li>
                    </ul>
                </div>
                <button id="racing-start-btn" class="btn btn-primary glow-btn btn-large">START ENGINE</button>
            `;
            document.getElementById('racing-start-btn').addEventListener('click', () => {
                initAudio();
                startOverlay.style.display = 'none';
                
                playing = true;
                score = 0;
                distance = 0;
                fuel = maxFuel;
                speedMultiplier = 1;
                invincibilityTimer = 0;
                lastTime = performance.now();
                
                objects.forEach(obj => scene.remove(obj.mesh));
                objects = [];
                
                scoreDisplay.textContent = `Score: ${score}`;
                globalScoreEl.textContent = score;
                updateFuelUI();
                powerupText.textContent = '';
                
                if (engineSound) { engineSound.osc.stop(); }
                stopBackgroundMusic();
                playBackgroundMusic();
                engineSound = playSound('hum');
                playSound('ping');
                
                gameLoopReq = requestAnimationFrame(gameLoop);
            });
        });

        setTimeout(() => {
            if(!playing) triggerAdWall(coinsWon);
        }, 1500);
    }
}
// ==========================================

// ==========================================
// GAME 2: Reaction Timer (Cyber Match)
// ==========================================
function initCyberMatch() {
    gameCanvasArea.innerHTML = `
        <div style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#050510; border-radius:12px; overflow:hidden;">
            <div style="margin-bottom:10px; color:#fff; font-size:1.5rem; text-shadow:0 0 10px #A020F0;">Time Left: <span id="cyber-timer">1:45</span></div>
            <canvas id="match-canvas" width="400" height="400" style="background:#111; cursor:pointer; box-shadow: 0 0 30px rgba(160, 32, 240, 0.2); border: 2px solid rgba(160, 32, 240, 0.5); border-radius:8px;"></canvas>
            
            <div id="match-start-overlay" style="position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(5,5,16,0.85); z-index:10;">
                <h2 style="color:#A020F0; margin-bottom:1rem; text-shadow:0 0 15px #A020F0; font-size: 2.5rem;">Cyber Match</h2>
                <div style="background:rgba(0,0,0,0.5); padding:1.5rem; border-radius:12px; border:1px solid rgba(160, 32, 240, 0.2); margin-bottom:2rem; text-align:center; max-width:85%;">
                    <h4 style="color:#fff; margin-bottom:1rem; font-size:1.2rem;">How to Play</h4>
                    <p style="color:#ccc; font-size:0.95rem; line-height:1.6; margin:0;">
                        Click a gem, then click an adjacent gem to swap them.<br>
                        Match 3 or more of the same color to score points.<br>
                        You have 1 minute and 45 seconds to get the highest score!
                    </p>
                </div>
                <button id="match-start-btn" class="btn btn-primary glow-btn btn-large" style="background:linear-gradient(45deg, #6000c0, #a020f0); box-shadow:0 0 20px #a020f0;">HACK THE GRID</button>
            </div>
        </div>
    `;

    sidebarCustomEl.innerHTML = `
        <div class="stat-box" style="margin-bottom:1rem;">
            <span>Score</span>
            <h3 id="sidebar-score">0</h3>
        </div>
        <div class="stat-box">
            <span>Matches</span>
            <h3 id="sidebar-matches">0</h3>
        </div>
    `;

    const canvas = document.getElementById('match-canvas');
    const ctx = canvas.getContext('2d');
    const startOverlay = document.getElementById('match-start-overlay');
    const startBtn = document.getElementById('match-start-btn');
    const timerEl = document.getElementById('cyber-timer');
    const sidebarScoreEl = document.getElementById('sidebar-score');
    const sidebarMatchesEl = document.getElementById('sidebar-matches');
    
    const ROWS = 8;
    const COLS = 8;
    const GEM_SIZE = 50;
    const GEM_COLORS = ['#00E5FF', '#FF0055', '#FFD700', '#A020F0', '#00FF88'];
    
    let board = [];
    let playing = false;
    let score = 0;
    let totalMatches = 0;
    let timeLeft = 105;
    let timerInterval = null;
    let animationReq = null;
    let selectedGem = null;
    
    let isAnimating = false;
    let particles = [];
    
    currentGame = {
        cleanup: () => {
            playing = false;
            clearInterval(timerInterval);
            cancelAnimationFrame(animationReq);
        },
        isPlaying: () => playing,
        getScore: () => score,
        endGame: endGame
    };

    function initBoard() {
        board = [];
        for (let r = 0; r < ROWS; r++) {
            board[r] = [];
            for (let c = 0; c < COLS; c++) {
                let type;
                do {
                    type = Math.floor(Math.random() * GEM_COLORS.length);
                } while (
                    (c >= 2 && board[r][c-1].type === type && board[r][c-2].type === type) ||
                    (r >= 2 && board[r-1][c].type === type && board[r-2][c].type === type)
                );
                
                board[r][c] = {
                    type: type,
                    x: c * GEM_SIZE,
                    y: r * GEM_SIZE,
                    targetX: c * GEM_SIZE,
                    targetY: r * GEM_SIZE,
                    alpha: 1.0,
                    scale: 1.0
                };
            }
        }
    }

    startBtn.addEventListener('click', () => {
        initAudio();
        startOverlay.style.display = 'none';
        initBoard();
        
        playing = true;
        score = 0;
        totalMatches = 0;
        timeLeft = 105;
        isAnimating = false;
        selectedGem = null;
        particles = [];
        
        globalScoreEl.textContent = score;
        sidebarScoreEl.textContent = score;
        sidebarMatchesEl.textContent = totalMatches;
        timerEl.textContent = formatTime(timeLeft);
        globalTimerEl.textContent = formatTime(timeLeft);
        
        timerInterval = setInterval(() => {
            if (!playing) return;
            timeLeft--;
            timerEl.textContent = formatTime(timeLeft);
            globalTimerEl.textContent = formatTime(timeLeft);
            if (timeLeft <= 0) {
                endGame("TIME'S UP!");
            }
        }, 1000);
        
        playSound('success');
        gameLoop();
    });

    canvas.addEventListener('mousedown', (e) => {
        if (!playing || isAnimating) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const c = Math.floor(x / GEM_SIZE);
        const r = Math.floor(y / GEM_SIZE);
        
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
        
        if (!selectedGem) {
            selectedGem = {r, c};
            playSound('click');
        } else {
            const dr = Math.abs(selectedGem.r - r);
            const dc = Math.abs(selectedGem.c - c);
            
            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                // Adjacent! Swap them.
                attemptSwap(selectedGem.r, selectedGem.c, r, c);
            } else if (dr === 0 && dc === 0) {
                // Clicked same gem, deselect
                selectedGem = null;
            } else {
                // Clicked far away gem, select it instead
                selectedGem = {r, c};
                playSound('click');
            }
        }
    });
    
    function attemptSwap(r1, c1, r2, c2) {
        selectedGem = null;
        isAnimating = true;
        
        // Swap logic
        let temp = board[r1][c1];
        board[r1][c1] = board[r2][c2];
        board[r2][c2] = temp;
        
        board[r1][c1].targetX = c1 * GEM_SIZE;
        board[r1][c1].targetY = r1 * GEM_SIZE;
        board[r2][c2].targetX = c2 * GEM_SIZE;
        board[r2][c2].targetY = r2 * GEM_SIZE;
        
        playSound('blip');
        
        // Wait for animation, then check match
        setTimeout(() => {
            if (!playing) return;
            let matches = findMatches();
            if (matches.length > 0) {
                handleMatches(matches);
            } else {
                // Swap back
                let t = board[r1][c1];
                board[r1][c1] = board[r2][c2];
                board[r2][c2] = t;
                
                board[r1][c1].targetX = c1 * GEM_SIZE;
                board[r1][c1].targetY = r1 * GEM_SIZE;
                board[r2][c2].targetX = c2 * GEM_SIZE;
                board[r2][c2].targetY = r2 * GEM_SIZE;
                
                playSound('fail');
                setTimeout(() => { isAnimating = false; }, 300);
            }
        }, 300);
    }
    
    function findMatches() {
        let matches = [];
        
        // Horizontal
        for (let r = 0; r < ROWS; r++) {
            let matchLength = 1;
            for (let c = 0; c < COLS; c++) {
                let checkMatch = false;
                if (c === COLS - 1) {
                    checkMatch = true;
                } else {
                    if (board[r][c] && board[r][c+1] && board[r][c].type === board[r][c+1].type) {
                        matchLength++;
                    } else {
                        checkMatch = true;
                    }
                }
                
                if (checkMatch) {
                    if (matchLength >= 3) {
                        for (let i = 0; i < matchLength; i++) {
                            matches.push({r: r, c: c - i});
                        }
                    }
                    matchLength = 1;
                }
            }
        }
        
        // Vertical
        for (let c = 0; c < COLS; c++) {
            let matchLength = 1;
            for (let r = 0; r < ROWS; r++) {
                let checkMatch = false;
                if (r === ROWS - 1) {
                    checkMatch = true;
                } else {
                    if (board[r][c] && board[r+1][c] && board[r][c].type === board[r+1][c].type) {
                        matchLength++;
                    } else {
                        checkMatch = true;
                    }
                }
                
                if (checkMatch) {
                    if (matchLength >= 3) {
                        for (let i = 0; i < matchLength; i++) {
                            matches.push({r: r - i, c: c});
                        }
                    }
                    matchLength = 1;
                }
            }
        }
        
        // Remove duplicates
        let uniqueMatches = [];
        matches.forEach(m => {
            if (!uniqueMatches.find(um => um.r === m.r && um.c === m.c)) {
                uniqueMatches.push(m);
            }
        });
        
        return uniqueMatches;
    }
    
    function handleMatches(matches) {
        playSound('coin');
        
        matches.forEach(m => {
            const gem = board[m.r][m.c];
            if (gem) {
                createExplosion(gem.x + GEM_SIZE/2, gem.y + GEM_SIZE/2, GEM_COLORS[gem.type]);
                board[m.r][m.c] = null;
            }
        });
        
        let pts = matches.length; 
        score += pts;
        totalMatches++;
        globalScoreEl.textContent = score;
        sidebarScoreEl.textContent = score;
        sidebarMatchesEl.textContent = totalMatches;
        
        setTimeout(() => {
            if(!playing) return;
            applyGravity();
        }, 300);
    }
    
    function applyGravity() {
        let moved = false;
        
        for (let c = 0; c < COLS; c++) {
            let emptySpaces = 0;
            for (let r = ROWS - 1; r >= 0; r--) {
                if (board[r][c] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    board[r + emptySpaces][c] = board[r][c];
                    board[r + emptySpaces][c].targetY = (r + emptySpaces) * GEM_SIZE;
                    board[r][c] = null;
                    moved = true;
                }
            }
            
            // Spawn new ones
            for (let i = 0; i < emptySpaces; i++) {
                let type = Math.floor(Math.random() * GEM_COLORS.length);
                board[i][c] = {
                    type: type,
                    x: c * GEM_SIZE,
                    y: (i - emptySpaces) * GEM_SIZE,
                    targetX: c * GEM_SIZE,
                    targetY: i * GEM_SIZE,
                    alpha: 1.0,
                    scale: 1.0
                };
                moved = true;
            }
        }
        
        setTimeout(() => {
            if(!playing) return;
            let matches = findMatches();
            if (matches.length > 0) {
                handleMatches(matches);
            } else {
                isAnimating = false;
            }
        }, 400); // Wait for fall
    }
    
    function createExplosion(x, y, color) {
        for(let i=0; i<15; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                life: 1.0,
                color: color
            });
        }
    }

    function gameLoop() {
        if (!playing) return;
        
        // Update physics
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                let gem = board[r][c];
                if (gem) {
                    gem.x += (gem.targetX - gem.x) * 0.2;
                    gem.y += (gem.targetY - gem.y) * 0.2;
                }
            }
        }
        
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            p.life -= 0.016 * 2;
            if (p.life <= 0) particles.splice(i, 1);
        }
        
        render();
        animationReq = requestAnimationFrame(gameLoop);
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid background
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= ROWS; i++) {
            ctx.beginPath(); ctx.moveTo(0, i * GEM_SIZE); ctx.lineTo(canvas.width, i * GEM_SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(i * GEM_SIZE, 0); ctx.lineTo(i * GEM_SIZE, canvas.height); ctx.stroke();
        }
        
        // Draw gems
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                let gem = board[r][c];
                if (gem) {
                    ctx.save();
                    ctx.translate(gem.x + GEM_SIZE/2, gem.y + GEM_SIZE/2);
                    
                    let isSelected = (selectedGem && selectedGem.r === r && selectedGem.c === c);
                    if (isSelected) {
                        ctx.scale(1.1, 1.1);
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = GEM_COLORS[gem.type];
                    }
                    
                    ctx.fillStyle = GEM_COLORS[gem.type];
                    ctx.globalAlpha = gem.alpha;
                    
                    const pad = 6;
                    const size = GEM_SIZE - pad * 2;
                    
                    // Distinct shapes based on type
                    ctx.beginPath();
                    if (gem.type === 0) { // Diamond
                        ctx.moveTo(0, -size/2);
                        ctx.lineTo(size/2, 0);
                        ctx.lineTo(0, size/2);
                        ctx.lineTo(-size/2, 0);
                    } else if (gem.type === 1) { // Square
                        ctx.rect(-size/2, -size/2, size, size);
                    } else if (gem.type === 2) { // Circle
                        ctx.arc(0, 0, size/2, 0, Math.PI * 2);
                    } else if (gem.type === 3) { // Triangle
                        ctx.moveTo(0, -size/2);
                        ctx.lineTo(size/2, size/2);
                        ctx.lineTo(-size/2, size/2);
                    } else if (gem.type === 4) { // Hexagon
                        for (let i=0; i<6; i++) {
                            ctx.lineTo((size/2) * Math.cos(i * Math.PI / 3), (size/2) * Math.sin(i * Math.PI / 3));
                        }
                    }
                    ctx.closePath();
                    
                    ctx.shadowBlur = isSelected ? 30 : 10;
                    ctx.shadowColor = GEM_COLORS[gem.type];
                    ctx.fill();
                    
                    // Inner highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.shadowBlur = 0;
                    ctx.fill();
                    
                    // Border
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = isSelected ? 2 : 1;
                    ctx.stroke();
                    
                    ctx.restore();
                }
            }
        }
        
        // Draw Particles
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }

    function endGame(reason) {
        if (!playing) return;
        playing = false;
        clearInterval(timerInterval);
        cancelAnimationFrame(animationReq);
        
        let coinsWon = score; 
        if (coinsWon < 1) coinsWon = 1; 
        
        startOverlay.innerHTML = `
            <h2 style="color:#A020F0; margin-bottom:1rem; text-shadow:0 0 15px #A020F0;">${reason}</h2>
            <h3 style="color:#fff; margin-bottom:2rem;">Final Score: ${score}</h3>
            <button id="match-restart-btn" class="btn btn-primary glow-btn btn-large" style="background:linear-gradient(45deg, #6000c0, #a020f0); margin-bottom: 1rem;">PLAY AGAIN</button>
            <p style="color:var(--text-muted); font-size:0.9rem;">Submitting score shortly...</p>
        `;
        startOverlay.style.display = 'flex';
        
        document.getElementById('match-restart-btn').addEventListener('click', () => {
            startOverlay.innerHTML = `
                <h2 style="color:#A020F0; margin-bottom:1rem; text-shadow:0 0 15px #A020F0; font-size: 2.5rem;">Cyber Match</h2>
                <div style="background:rgba(0,0,0,0.5); padding:1.5rem; border-radius:12px; border:1px solid rgba(160, 32, 240, 0.2); margin-bottom:2rem; text-align:center; max-width:85%;">
                    <h4 style="color:#fff; margin-bottom:1rem; font-size:1.2rem;">How to Play</h4>
                    <p style="color:#ccc; font-size:0.95rem; line-height:1.6; margin:0;">
                        Click a gem, then click an adjacent gem to swap them.<br>
                        Match 3 or more of the same color to score points.<br>
                        You have 1 minute and 45 seconds to get the highest score!
                    </p>
                </div>
                <button id="match-start-btn" class="btn btn-primary glow-btn btn-large" style="background:linear-gradient(45deg, #6000c0, #a020f0); box-shadow:0 0 20px #a020f0;">HACK THE GRID</button>
            `;
            document.getElementById('match-start-btn').addEventListener('click', () => {
                initAudio();
                startOverlay.style.display = 'none';
                initBoard();
                
                playing = true;
                score = 0;
                totalMatches = 0;
                timeLeft = 105;
                isAnimating = false;
                selectedGem = null;
                particles = [];
                
                globalScoreEl.textContent = score;
                sidebarScoreEl.textContent = score;
                sidebarMatchesEl.textContent = totalMatches;
                timerEl.textContent = formatTime(timeLeft);
                globalTimerEl.textContent = formatTime(timeLeft);
                
                timerInterval = setInterval(() => {
                    if (!playing) return;
                    timeLeft--;
                    timerEl.textContent = formatTime(timeLeft);
                    globalTimerEl.textContent = formatTime(timeLeft);
                    if (timeLeft <= 0) {
                        endGame("TIME'S UP!");
                    }
                }, 1000);
                
                playSound('success');
                gameLoop();
            });
        });

        setTimeout(() => {
            if(!playing) triggerAdWall(coinsWon);
        }, 1500);
    }
}

// GAME 3: Galactic Strike
// ==========================================
function initGalacticStrike() {
    gameCanvasArea.innerHTML = `
        <div style="position:relative; width:100%; height:100%; display:flex; justify-content:center; align-items:center; background:#050510; border-radius:12px; overflow:hidden;">
            <canvas id="strike-canvas" width="800" height="500" style="background:#020205; cursor:crosshair; box-shadow: 0 0 30px rgba(0, 229, 255, 0.2); border: 2px solid rgba(0, 229, 255, 0.5); border-radius:8px;"></canvas>
            
            <div id="strike-start-overlay" style="position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(5,5,16,0.85); z-index:10;">
                <h2 style="color:#00E5FF; margin-bottom:1rem; text-shadow:0 0 15px #00E5FF; font-size: 2.5rem;">Galactic Strike</h2>
                <div style="background:rgba(0,0,0,0.5); padding:1.5rem; border-radius:12px; border:1px solid rgba(0, 229, 255, 0.2); margin-bottom:2rem; text-align:center; max-width:85%;">
                    <h4 style="color:#fff; margin-bottom:1rem; font-size:1.2rem;">How to Play</h4>
                    <p style="color:#ccc; font-size:0.95rem; line-height:1.6; margin:0;">
                        Use your mouse to move your spaceship.<br>
                        Hold Click to shoot! Destroy Alien Ships and Meteors.<br>
                        Alien ships randomly drop Power-Ups (Dual, Quad, Invisibility).<br>
                        Survive for 2 minutes to secure your high score!
                    </p>
                </div>
                <button id="strike-start-btn" class="btn btn-primary glow-btn btn-large" style="background:linear-gradient(45deg, #0088cc, #00E5FF); box-shadow:0 0 20px #00E5FF;">LAUNCH FIGHTER</button>
            </div>
            
            <div id="strike-ui" style="position:absolute; top:15px; left:15px; display:none; pointer-events:none;">
                <div id="strike-powerup-text" style="color:#FF0055; font-size:1.2rem; font-weight:bold; text-shadow:0 0 10px #FF0055;"></div>
            </div>
        </div>
    `;

    sidebarCustomEl.innerHTML = `
        <div class="stat-box" style="margin-bottom:1rem;">
            <span>Score</span>
            <h3 id="sidebar-strike-score">0</h3>
        </div>
        <div class="stat-box" style="margin-bottom:1rem;">
            <span>Kills</span>
            <h3 id="sidebar-strike-kills">0</h3>
        </div>
        <div class="stat-box">
            <span>Powerups</span>
            <h3 id="sidebar-strike-powerups">0</h3>
        </div>
    `;

    const canvas = document.getElementById('strike-canvas');
    const ctx = canvas.getContext('2d');
    const startOverlay = document.getElementById('strike-start-overlay');
    const startBtn = document.getElementById('strike-start-btn');
    
    let scoreEl = document.getElementById('sidebar-strike-score');
    let killsEl = document.getElementById('sidebar-strike-kills');
    let powerupsEl = document.getElementById('sidebar-strike-powerups');
    let powerupText = document.getElementById('strike-powerup-text');
    let uiLayer = document.getElementById('strike-ui');

    let playing = false;
    let score = 0;
    let kills = 0;
    let powerupsCollected = 0;
    let timeLeft = 120;
    let timerInterval = null;
    let animationReq = null;
    let lastTime = 0;
    
    // Entities
    let player = { x: 400, y: 450, w: 40, h: 40, isShooting: false, fireCooldown: 0, 
                   powerup: 'none', powerupTimer: 0, opacity: 1.0 };
    let projectiles = [];
    let enemies = [];
    let enemyProjectiles = [];
    let powerups = [];
    let particles = [];
    let stars = [];
    
    // Input
    let mouseX = 400;
    let mouseY = 450;
    
    canvas.addEventListener('mousemove', (e) => {
        if (!playing) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        mouseX = (e.clientX - rect.left) * scaleX;
        mouseY = (e.clientY - rect.top) * scaleY;
    });
    
    canvas.addEventListener('mousedown', () => { player.isShooting = true; initAudio(); });
    canvas.addEventListener('mouseup', () => { player.isShooting = false; });
    canvas.addEventListener('mouseleave', () => { player.isShooting = false; });

    canvas.addEventListener('touchmove', (e) => {
        if (!playing) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        mouseX = (touch.clientX - rect.left) * scaleX;
        mouseY = (touch.clientY - rect.top) * scaleY;
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        if (!playing) return;
        e.preventDefault();
        player.isShooting = true;
        initAudio();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        mouseX = (touch.clientX - rect.left) * scaleX;
        mouseY = (touch.clientY - rect.top) * scaleY;
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        player.isShooting = false;
    });
    
    // Background Stars
    for(let i=0; i<100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 2 + 0.5
        });
    }

    currentGame = {
        cleanup: () => {
            playing = false;
            clearInterval(timerInterval);
            cancelAnimationFrame(animationReq);
        },
        isPlaying: () => playing,
        getScore: () => score,
        endGame: endGame
    };

    function resetGame() {
        score = 0;
        kills = 0;
        powerupsCollected = 0;
        timeLeft = 120;
        player.powerup = 'none';
        player.powerupTimer = 0;
        player.opacity = 1.0;
        projectiles = [];
        enemies = [];
        enemyProjectiles = [];
        powerups = [];
        particles = [];
        
        scoreEl.textContent = score;
        killsEl.textContent = kills;
        powerupsEl.textContent = powerupsCollected;
        globalScoreEl.textContent = score;
        globalTimerEl.textContent = formatTime(timeLeft);
        uiLayer.style.display = 'block';
        powerupText.textContent = '';
    }

    startBtn.addEventListener('click', () => {
        initAudio();
        startOverlay.style.display = 'none';
        resetGame();
        playing = true;
        
        timerInterval = setInterval(() => {
            if (!playing) return;
            timeLeft--;
            globalTimerEl.textContent = formatTime(timeLeft);
            if (timeLeft <= 0) {
                endGame("MISSION ACCOMPLISHED");
            }
        }, 1000);
        
        playSound('success');
        lastTime = performance.now();
        animationReq = requestAnimationFrame(gameLoop);
    });

    function createExplosion(x, y, color, amount) {
        for(let i=0; i<amount; i++) {
            particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400,
                life: 1.0,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }

    function dropPowerUp(x, y) {
        if (Math.random() > 0.3) return; // 30% drop chance
        const types = ['dual', 'quad', 'invis'];
        const type = types[Math.floor(Math.random() * types.length)];
        powerups.push({
            x: x, y: y, radius: 15, type: type, vy: 100
        });
    }

    function spawnEnemy() {
        if (Math.random() < 0.02) {
            enemies.push({
                type: 'meteor',
                x: Math.random() * (canvas.width - 40) + 20,
                y: -50,
                radius: Math.random() * 15 + 15,
                vx: (Math.random() - 0.5) * 50,
                vy: Math.random() * 100 + 100,
                hp: 3,
                maxHp: 3,
                rotation: 0,
                rotSpeed: (Math.random() - 0.5) * 5
            });
        }
        if (Math.random() < 0.015) {
            enemies.push({
                type: 'alien',
                x: Math.random() * (canvas.width - 40) + 20,
                y: -50,
                w: 40, h: 30,
                vx: (Math.random() - 0.5) * 150,
                vy: 80,
                hp: 5,
                fireCooldown: Math.random() * 2
            });
        }
    }

    function updatePhysics(dt) {
        // Player Movement (smooth follow mouse)
        player.x += (mouseX - player.x) * 10 * dt;
        player.y += (mouseY - player.y) * 10 * dt;
        
        if(player.x < player.w/2) player.x = player.w/2;
        if(player.x > canvas.width - player.w/2) player.x = canvas.width - player.w/2;
        if(player.y < player.h/2) player.y = player.h/2;
        if(player.y > canvas.height - player.h/2) player.y = canvas.height - player.h/2;
        
        if (player.powerupTimer > 0) {
            player.powerupTimer -= dt;
            powerupText.textContent = player.powerup.toUpperCase() + " : " + Math.ceil(player.powerupTimer) + "s";
            if (player.powerupTimer <= 0) {
                player.powerup = 'none';
                player.opacity = 1.0;
                powerupText.textContent = "";
                playSound('fail');
            }
        }
        
        player.fireCooldown -= dt;
        if (player.isShooting && player.fireCooldown <= 0) {
            player.fireCooldown = 0.15;
            playSound('blip');
            
            if (player.powerup === 'quad') {
                projectiles.push({ x: player.x - 20, y: player.y, vy: -600, radius: 4, color: '#FF0055' });
                projectiles.push({ x: player.x - 10, y: player.y - 10, vy: -600, radius: 4, color: '#FF0055' });
                projectiles.push({ x: player.x + 10, y: player.y - 10, vy: -600, radius: 4, color: '#FF0055' });
                projectiles.push({ x: player.x + 20, y: player.y, vy: -600, radius: 4, color: '#FF0055' });
            } else if (player.powerup === 'dual') {
                projectiles.push({ x: player.x - 15, y: player.y, vy: -600, radius: 4, color: '#00FF88' });
                projectiles.push({ x: player.x + 15, y: player.y, vy: -600, radius: 4, color: '#00FF88' });
            } else {
                projectiles.push({ x: player.x, y: player.y - 10, vy: -600, radius: 4, color: '#00E5FF' });
            }
        }
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i];
            p.y += p.vy * dt;
            if (p.y < -20) projectiles.splice(i, 1);
        }
        
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            let ep = enemyProjectiles[i];
            ep.y += ep.vy * dt;
            if (ep.y > canvas.height + 20) enemyProjectiles.splice(i, 1);
            
            if (player.powerup !== 'invis') {
                let dist = Math.hypot(ep.x - player.x, ep.y - player.y);
                if (dist < 20) {
                    createExplosion(player.x, player.y, '#FF0055', 20);
                    score = Math.max(0, score - 50);
                    globalScoreEl.textContent = score;
                    scoreEl.textContent = score;
                    playSound('fail');
                    enemyProjectiles.splice(i, 1);
                }
            }
        }
        
        spawnEnemy();
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i];
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            
            if (e.type === 'meteor') {
                e.rotation += e.rotSpeed * dt;
            }
            
            if (e.type === 'alien') {
                if (e.x < 30 || e.x > canvas.width - 30) e.vx *= -1;
                
                e.fireCooldown -= dt;
                if (e.fireCooldown <= 0) {
                    e.fireCooldown = 1.5 + Math.random();
                    enemyProjectiles.push({ x: e.x, y: e.y + 15, vy: 300, radius: 4, color: '#FF0055' });
                }
            }
            
            if (e.y > canvas.height + 50) {
                enemies.splice(i, 1);
                continue;
            }
            
            if (player.powerup !== 'invis') {
                let dist = Math.hypot(e.x - player.x, e.y - player.y);
                let hitRadius = e.type === 'meteor' ? e.radius : 20;
                if (dist < hitRadius + 15) {
                    createExplosion(player.x, player.y, '#FF0055', 30);
                    score = Math.max(0, score - 100);
                    globalScoreEl.textContent = score;
                    scoreEl.textContent = score;
                    playSound('fail');
                    enemies.splice(i, 1);
                    continue;
                }
            }
            
            for (let j = projectiles.length - 1; j >= 0; j--) {
                let p = projectiles[j];
                let dist = Math.hypot(e.x - p.x, e.y - p.y);
                let hitRadius = e.type === 'meteor' ? e.radius : 20;
                
                if (dist < hitRadius + p.radius) {
                    e.hp--;
                    createExplosion(p.x, p.y, p.color, 5);
                    projectiles.splice(j, 1);
                    
                    if (e.hp <= 0) {
                        createExplosion(e.x, e.y, e.type === 'meteor' ? '#FFD700' : '#A020F0', 30);
                        playSound('coin');
                        
                        kills++;
                        killsEl.textContent = kills;
                        let pts = e.type === 'meteor' ? 10 : 25;
                        score += pts;
                        globalScoreEl.textContent = score;
                        scoreEl.textContent = score;
                        
                        if (e.type === 'alien') {
                            dropPowerUp(e.x, e.y);
                        }
                        
                        enemies.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        for (let i = powerups.length - 1; i >= 0; i--) {
            let pu = powerups[i];
            pu.y += pu.vy * dt;
            
            if (pu.y > canvas.height + 20) {
                powerups.splice(i, 1);
                continue;
            }
            
            let dist = Math.hypot(pu.x - player.x, pu.y - player.y);
            if (dist < pu.radius + 20) {
                playSound('success');
                player.powerup = pu.type;
                player.powerupTimer = 10.0;
                powerupsCollected++;
                powerupsEl.textContent = powerupsCollected;
                
                if (pu.type === 'invis') {
                    player.opacity = 0.3;
                } else {
                    player.opacity = 1.0;
                }
                
                createExplosion(pu.x, pu.y, '#FFFFFF', 20);
                powerups.splice(i, 1);
            }
        }
        
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2;
            if (p.life <= 0) particles.splice(i, 1);
        }
        
        stars.forEach(s => {
            s.y += s.speed * dt * 60;
            if (s.y > canvas.height) {
                s.y = 0;
                s.x = Math.random() * canvas.width;
            }
        });
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFF';
        stars.forEach(s => {
            ctx.globalAlpha = Math.random() * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.globalAlpha = player.opacity;
        
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(20, 15);
        ctx.lineTo(0, 5);
        ctx.lineTo(-20, 15);
        ctx.closePath();
        
        let pColor = '#00E5FF';
        if (player.powerup === 'dual') pColor = '#00FF88';
        if (player.powerup === 'quad') pColor = '#FF0055';
        if (player.powerup === 'invis') pColor = '#A020F0';
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = pColor;
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.strokeStyle = pColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-10, 10);
        ctx.lineTo(0, 25 + Math.random() * 10);
        ctx.lineTo(10, 10);
        ctx.fillStyle = '#FF9900';
        ctx.shadowColor = '#FF9900';
        ctx.fill();
        
        ctx.restore();
        
        projectiles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fill();
        });
        
        enemyProjectiles.forEach(ep => {
            ctx.beginPath();
            ctx.arc(ep.x, ep.y, ep.radius, 0, Math.PI*2);
            ctx.fillStyle = ep.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = ep.color;
            ctx.fill();
        });
        
        enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);
            if (e.type === 'meteor') {
                ctx.rotate(e.rotation);
                ctx.beginPath();
                for(let i=0; i<8; i++) {
                    let a = (i/8) * Math.PI * 2;
                    let r = e.radius * (0.8 + Math.random()*0.4);
                    if (i===0) ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r);
                    else ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
                }
                ctx.closePath();
                ctx.fillStyle = '#222';
                ctx.fill();
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#FFD700';
                ctx.stroke();
            } else if (e.type === 'alien') {
                ctx.beginPath();
                ctx.ellipse(0, 0, e.w/2, e.h/3, 0, 0, Math.PI*2);
                ctx.fillStyle = '#111';
                ctx.fill();
                ctx.strokeStyle = '#A020F0';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#A020F0';
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(0, -e.h/4, e.w/4, Math.PI, 0);
                ctx.strokeStyle = '#00E5FF';
                ctx.stroke();
            }
            ctx.restore();
            
            if (e.hp < e.maxHp && e.type === 'meteor') {
                ctx.fillStyle = '#FF4444';
                ctx.fillRect(e.x - 15, e.y - e.radius - 10, 30 * (e.hp/e.maxHp), 4);
            }
        });
        
        powerups.forEach(pu => {
            ctx.save();
            ctx.translate(pu.x, pu.y);
            
            let color = '#FFF';
            let label = 'P';
            if(pu.type === 'dual') { color = '#00FF88'; label = 'D'; }
            if(pu.type === 'quad') { color = '#FF0055'; label = 'Q'; }
            if(pu.type === 'invis'){ color = '#A020F0'; label = 'I'; }
            
            ctx.beginPath();
            ctx.arc(0, 0, pu.radius, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fill();
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
            ctx.stroke();
            
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 16px sans-serif';
            ctx.shadowBlur = 0;
            ctx.fillText(label, 0, 0);
            
            ctx.restore();
        });
        
        particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }

    function gameLoop(time) {
        if (!playing) return;
        
        let dt = (time - lastTime) / 1000;
        if (dt > 0.1) dt = 0.1;
        lastTime = time;
        
        updatePhysics(dt);
        render();
        
        animationReq = requestAnimationFrame(gameLoop);
    }
    
    function endGame(reason) {
        if (!playing) return;
        playing = false;
        clearInterval(timerInterval);
        cancelAnimationFrame(animationReq);
        uiLayer.style.display = 'none';
        
        let coinsWon = score; 
        if (coinsWon < 1) coinsWon = 1; 
        
        startOverlay.innerHTML = `
            <h2 style="color:#00E5FF; margin-bottom:1rem; text-shadow:0 0 15px #00E5FF;">${reason}</h2>
            <h3 style="color:#fff; margin-bottom:1rem;">Final Score: ${score}</h3>
            <p style="color:#A020F0; margin-bottom:2rem;">Kills: ${kills} | Power-ups: ${powerupsCollected}</p>
            <button id="strike-restart-btn" class="btn btn-primary glow-btn btn-large" style="background:linear-gradient(45deg, #0088cc, #00E5FF); margin-bottom: 1rem;">PLAY AGAIN</button>
            <p style="color:var(--text-muted); font-size:0.9rem;">Submitting score shortly...</p>
        `;
        startOverlay.style.display = 'flex';
        
        document.getElementById('strike-restart-btn').addEventListener('click', () => {
            startOverlay.innerHTML = `
                <h2 style="color:#00E5FF; margin-bottom:1rem; text-shadow:0 0 15px #00E5FF; font-size: 2.5rem;">Galactic Strike</h2>
                <div style="background:rgba(0,0,0,0.5); padding:1.5rem; border-radius:12px; border:1px solid rgba(0, 229, 255, 0.2); margin-bottom:2rem; text-align:center; max-width:85%;">
                    <h4 style="color:#fff; margin-bottom:1rem; font-size:1.2rem;">How to Play</h4>
                    <p style="color:#ccc; font-size:0.95rem; line-height:1.6; margin:0;">
                        Use your mouse to move your spaceship.<br>
                        Hold Click to shoot! Destroy Alien Ships and Meteors.<br>
                        Alien ships randomly drop Power-Ups (Dual, Quad, Invisibility).<br>
                        Survive for 2 minutes to secure your high score!
                    </p>
                </div>
                <button id="strike-start-btn" class="btn btn-primary glow-btn btn-large" style="background:linear-gradient(45deg, #0088cc, #00E5FF); box-shadow:0 0 20px #00E5FF;">LAUNCH FIGHTER</button>
            `;
            document.getElementById('strike-start-btn').addEventListener('click', () => {
                initAudio();
                startOverlay.style.display = 'none';
                resetGame();
                playing = true;
                
                timerInterval = setInterval(() => {
                    if (!playing) return;
                    timeLeft--;
                    globalTimerEl.textContent = formatTime(timeLeft);
                    if (timeLeft <= 0) {
                        endGame("MISSION ACCOMPLISHED");
                    }
                }, 1000);
                
                playSound('success');
                lastTime = performance.now();
                animationReq = requestAnimationFrame(gameLoop);
            });
        });

        setTimeout(() => {
            if(!playing) triggerAdWall(coinsWon);
        }, 1500);
    }
}
