let elements = {};
let speedMode = 1;
let indicators = 0;

const onOrOff = state => state ? 'On' : 'Off';

/* ========================================
   SVG GAUGE HELPERS
   ======================================== */

/**
 * Builds tick marks for an SVG gauge.
 */
function buildTicks(containerId, options) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { center, radii, angles, counts } = options;
    const [cx, cy] = center;
    const [rOuter, rInnerMajor, rInnerMinor] = radii;
    const [startAngle, totalAngle] = angles;
    const [majorCount, minorPerSegment] = counts;

    let html = '';
    const step = totalAngle / (majorCount - 1);

    for (let i = 0; i < majorCount; i++) {
        const angle = (startAngle + i * step) * (Math.PI / 180);

        // Major Tick
        const x1 = cx + rOuter * Math.cos(angle);
        const y1 = cy + rOuter * Math.sin(angle);
        const x2 = cx + rInnerMajor * Math.cos(angle);
        const y2 = cy + rInnerMajor * Math.sin(angle);
        html += `<line class="tick-major" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;

        // Minor Ticks
        if (i < majorCount - 1) {
            const minorStep = step / (minorPerSegment + 1);
            for (let j = 1; j <= minorPerSegment; j++) {
                const mAngle = (startAngle + i * step + j * minorStep) * (Math.PI / 180);
                const mx1 = cx + rOuter * Math.cos(mAngle);
                const my1 = cy + rOuter * Math.sin(mAngle);
                const mx2 = cx + rInnerMinor * Math.cos(mAngle);
                const my2 = cy + rInnerMinor * Math.sin(mAngle);
                html += `<line class="tick-minor" x1="${mx1}" y1="${my1}" x2="${mx2}" y2="${my2}" />`;
            }
        }
    }
    container.innerHTML = html;
}

/**
 * Updates the stroke-dasharray of an SVG arc to fill it.
 */
function setArcFill(el, fraction, arcLen, circ) {
    if (!el) return;
    const fill = Math.min(fraction, 1.0) * arcLen;
    el.setAttribute('stroke-dasharray', `${fill} ${circ}`);
}

/* ========================================
   API FUNCTIONS (SERVER COMPATIBLE)
   ======================================== */

function setEngine(state) {
    if (elements.engine) elements.engine.innerText = onOrOff(state);
    const badge = document.getElementById('engineBadge');
    if (badge) badge.classList.toggle('active', !!state);
}

function setSpeed(speed) {
    let unitText = 'MPH';
    let val = 0;
    switch (speedMode) {
        case 1: val = Math.round(speed * 2.236936); unitText = 'MPH'; break;
        case 2: val = Math.round(speed * 1.943844); unitText = 'Knots'; break;
        default: val = Math.round(speed * 3.6); unitText = 'KMH';
    }

    if (elements.speed) elements.speed.innerText = val;
    if (elements.unit) elements.unit.innerText = unitText;

    // Update Main Gauge (Max speed 300 for scale)
    setArcFill(elements.speedArc, val / 300, 433.54, 578.05);
}

function setRPM(rpm) {
    const rpmValue = Math.round(rpm * 10000);
    if (elements.rpm) elements.rpm.innerText = rpmValue;

    // Update RPM Arc (270deg arc, circ=314, len=235.6)
    setArcFill(elements.rpmArc, rpm, 235.62, 314.16);
    
    // Update RPM Indicator Position on the gauge
    const rpmIndicatorEl = document.getElementById('rpmIndicatorSVG');
    if (rpmIndicatorEl) {
        // Calculate angle: 150deg to 390deg (240 degree range) for the gauge arc
        const startAngle = 150;
        const totalAngle = 240;
        const angle = startAngle + (rpm * totalAngle);
        const radian = (angle) * (Math.PI / 180);
        
        // Position on arc at SVG coordinates - center is 110,110 with radius 92
        const centerX = 110;
        const centerY = 110;
        const radius = 92;
        const x = centerX + radius * Math.cos(radian);
        const y = centerY + radius * Math.sin(radian);
        
        rpmIndicatorEl.setAttribute('cx', x);
        rpmIndicatorEl.setAttribute('cy', y);
    }
}

function setFuel(fuel) {
    if (elements.fuel) elements.fuel.innerText = `${Math.round(fuel * 100)}%`;
    setArcFill(elements.fuelArc, fuel, 235.62, 314.16);
}

function setHealth(health) {
    if (elements.health) elements.health.innerText = `${(health * 100).toFixed(1)}%`;
    if (elements.healthFill) elements.healthFill.style.width = `${health * 100}%`;
}

function setGear(gear) {
    if (elements.gear) {
        if (gear === 0) elements.gear.innerText = 'R';
        else if (gear === 'N') elements.gear.innerText = 'N';
        else elements.gear.innerText = gear;
    }
}

function setHeadlights(state) {
    if (elements.headlights) {
        elements.headlights.innerText = state > 0 ? (state === 2 ? 'High' : 'On') : 'Off';
    }
    const badge = document.getElementById('headlightBadge');
    if (badge) badge.classList.toggle('active', state > 0);
}

function setLeftIndicator(state) {
    const light = document.getElementById('seinLeftLight');
    if (light) light.classList.toggle('active', !!state);
}

function setRightIndicator(state) {
    const light = document.getElementById('seinRightLight');
    if (light) light.classList.toggle('active', !!state);
}

function setSeatbelts(state) {
    if (elements.seatbelts) elements.seatbelts.innerText = onOrOff(state);
    const badge = document.getElementById('seatbeltBadge');
    if (badge) badge.classList.toggle('active', !!state);
}

function setSpeedMode(mode) { speedMode = mode; }

function setOdometer(distance) {
    if (elements.odometer) elements.odometer.innerText = distance.toFixed(1) + ' Miles';
}

/* ========================================
   INITIALIZATION
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Cache elements
    elements = {
        engine: document.getElementById('engine'),
        speed: document.getElementById('speed'),
        unit: document.getElementById('unit'),
        rpm: document.getElementById('rpm'),
        fuel: document.getElementById('fuel'),
        health: document.getElementById('health'),
        gear: document.getElementById('gear'),
        headlights: document.getElementById('headlights'),
        seatbelts: document.getElementById('seatbelts'),
        odometer: document.getElementById('odometer'),
        speedArc: document.getElementById('speedArc'),
        rpmArc: document.getElementById('rpmArc'),
        fuelArc: document.getElementById('fuelArc'),
        healthFill: document.getElementById('healthFill'),
    };

    // Initialize Ticks
    buildTicks('speedTicks', {
        center: [110, 110], radii: [101, 90, 95],
        angles: [150, 240], counts: [11, 4]
    });
    buildTicks('rpmTicks', {
        center: [65, 65], radii: [57, 49, 52],
        angles: [150, 240], counts: [9, 2]
    });
    buildTicks('fuelTicks', {
        center: [65, 65], radii: [57, 49, 52],
        angles: [150, 240], counts: [9, 2]
    });

    // Initial State Check
    setSpeed(0);
    setRPM(0);
    setFuel(1.0);
    setHealth(1.0);
    setGear('N');

    // =============================================
    // WELCOME SCREEN — DRAMATIC SEQUENCE
    // =============================================
    const ws = document.getElementById('welcomeScreen');
    const lightningEl = document.getElementById('lightningOverlay');
    const sparksEl = document.getElementById('sparksContainer');
    const contentEl = document.getElementById('welcomeContent');

    if (!ws) return;

    // --- Helper: Lightning Flash ---
    function triggerLightning() {
        if (!lightningEl) return;
        lightningEl.classList.remove('flash');
        void lightningEl.offsetWidth; // force reflow
        lightningEl.classList.add('flash');
    }

    // --- Helper: Spawn Sparks ---
    function spawnSparks(count) {
        if (!sparksEl) return;
        for (let i = 0; i < count; i++) {
            const spark = document.createElement('div');
            spark.className = 'spark';
            spark.style.left = `${40 + Math.random() * 20}%`;
            spark.style.top = `${35 + Math.random() * 30}%`;
            spark.style.setProperty('--sx', `${(Math.random() - 0.5) * 120}px`);
            spark.style.setProperty('--sy', `${(Math.random() - 0.5) * 120}px`);
            sparksEl.appendChild(spark);
            setTimeout(() => spark.remove(), 600);
        }
    }

    // --- PHASE 1: Ambient Lightning (0s – 2s) ---
    const ambientFlashes = [300, 800, 1200, 1700];
    ambientFlashes.forEach(t => {
        setTimeout(() => {
            triggerLightning();
            spawnSparks(3);
        }, t);
    });

    // --- PHASE 2: Glitch Mode (2s – 2.6s) ---
    setTimeout(() => {
        if (contentEl) contentEl.classList.add('glitch-active');
        triggerLightning();
        spawnSparks(8);
    }, 2000);

    // Extra glitch + lightning
    setTimeout(() => {
        triggerLightning();
        spawnSparks(6);
    }, 2200);

    setTimeout(() => {
        triggerLightning();
        spawnSparks(10);
    }, 2400);

    // --- PHASE 3: Shake + Final Burst (2.6s – 3.2s) ---
    setTimeout(() => {
        ws.classList.add('shake-active');
        triggerLightning();
        spawnSparks(15);
    }, 2600);

    setTimeout(() => {
        triggerLightning();
        spawnSparks(12);
    }, 2800);

    setTimeout(() => {
        triggerLightning();
        spawnSparks(20);
    }, 2950);

    // --- FINAL: Hide ---
    setTimeout(() => {
        ws.classList.remove('shake-active');
        if (contentEl) contentEl.classList.remove('glitch-active');
        ws.classList.add('hidden');
    }, 3200);
});
