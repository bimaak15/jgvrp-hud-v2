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
    switch(speedMode) {
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

    // Welcome Screen auto-hide
    setTimeout(() => {
        const ws = document.getElementById('welcomeScreen');
        if (ws) ws.classList.add('hidden');
    }, 3000);
});
