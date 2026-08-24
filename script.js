const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');

// Simulation parameters
const STAR_COUNT = 4000;
const ARMS = 4;
const GALAXY_RADIUS = 400;
const CORE_GLOW_RADIUS = 60;

let stars = [];
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Camera and interaction states
let angleX = 0.5; // Vertical tilt angle
let angleY = 0;   // Horizontal rotation angle
let targetAngleX = 0.6;
let targetAngleY = 0;

let mouseX = 0;
let mouseY = 0;
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
let warpSpeed = 1;

// Automatically handle window resizing
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

// Mouse Interaction Handling
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (isDragging) {
        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;
        targetAngleY += deltaX * 0.005;
        targetAngleX += deltaY * 0.005;
        // Limit vertical tilt to avoid flipping upside down
        targetAngleX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetAngleX));
    } else {
        // Subtle reactive tilt when just moving the mouse smoothly
        const normX = (e.clientX / width) - 0.5;
        const normY = (e.clientY / height) - 0.5;
        targetAngleY = normX * 0.5;
        targetAngleX = 0.6 + (normY * 0.4);
    }

    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

window.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

window.addEventListener('mouseup', () => isDragging = false);

// Star Object Structure
class Star {
    constructor() {
        this.reset();
        // Randomize initial progression so they don't spawn in a straight line
        this.angle = Math.random() * Math.PI * 2;
    }

    reset() {
        // Distribute stars heavily toward the core using exponential randoms
        this.distance = Math.pow(Math.random(), 2.5) * GALAXY_RADIUS;

        // Assign a spiral arm
        this.armIndex = Math.floor(Math.random() * ARMS);

        // Base positioning calculation along the spiral mathematical curve
        this.angle = (this.armIndex / ARMS) * Math.PI * 2;

        // Twist factor makes it look like a spiral whirlpool
        const twist = 3.5;
        this.angle += (this.distance / GALAXY_RADIUS) * twist;

        // Add random cluster scatter so it looks organic instead of a strict line
        const scatter = 35 * (this.distance / GALAXY_RADIUS + 0.2);
        this.x = Math.cos(this.angle) * this.distance + (Math.random() - 0.5) * scatter;
        this.z = Math.sin(this.angle) * this.distance + (Math.random() - 0.5) * scatter;
        this.y = (Math.random() - 0.5) * scatter * 0.4; // Flattened disk effect

        // Orbital speed: core moves much faster than outer edges
        this.speed = (0.02 * (1 - (this.distance / (GALAXY_RADIUS * 1.2)))) + 0.002;

        // Color assignment based on temperature/distance from center
        const coreColor = { r: 255, g: 230, b: 255 }; // Bright white-pink core
        const midColor = { r: 130, g: 140, b: 255 };  // Deep cosmic blue mid-arms
        const edgeColor = { r: 255, g: 90, b: 200 };  // Purple-magenta edges

        let ratio = this.distance / GALAXY_RADIUS;
        if (ratio < 0.3) {
            let factor = ratio / 0.3;
            this.r = lerp(coreColor.r, midColor.r, factor);
            this.g = lerp(coreColor.g, midColor.g, factor);
            this.b = lerp(coreColor.b, midColor.b, factor);
            this.size = Math.random() * 1.5 + 1.0;
        } else {
            let factor = (ratio - 0.3) / 0.7;
            this.r = lerp(midColor.r, edgeColor.r, factor);
            this.g = lerp(midColor.g, edgeColor.g, factor);
            this.b = lerp(midColor.b, edgeColor.b, factor);
            this.size = Math.random() * 1.2 + 0.5;
        }
    }

    update() {
        // Rotate position coordinates around the Y axis over time
        const currentSpeed = this.speed * warpSpeed;
        const cosS = Math.cos(currentSpeed);
        const sinS = Math.sin(currentSpeed);

        const nx = this.x * cosS - this.z * sinS;
        const nz = this.x * sinS + this.z * cosS;

        this.x = nx;
        this.z = nz;
    }

    project(cosX, sinX, cosY, sinY) {
        // Apply 3D matrix math transformations based on camera angles
        let x1 = this.x * cosY - this.z * sinY;
        let z1 = this.x * sinY + this.z * cosY;

        let y2 = this.y * cosX - z1 * sinX;
        let z2 = this.y * sinX + z1 * cosX;

        // Perspective matrix calculation (Depth perception)
        const focalLength = 600;
        const cameraDistance = 700;
        const scale = focalLength / (focalLength + z2 + cameraDistance);

        // Center mapping coordinates onto viewport
        const projX = x1 * scale + width / 2;
        const projY = y2 * scale + height / 2;

        return {
            x: projX,
            y: projY,
            size: this.size * scale * 1.8,
            depth: z2 // Used for sorting render sequence
        };
    }
}

// Helper function for color transitions
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Generate the galaxy system population
for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(new Star());
}

// Animation Loop Function
function loop() {
    // Smooth Camera dampening transitions
    angleX += (targetAngleX - angleX) * 0.05;
    angleY += (targetAngleY - angleY) * 0.05;

    // Trigger space warp multiplier effect during active mouse drag clicks
    if (isDragging) {
        warpSpeed += (3.0 - warpSpeed) * 0.05;
    } else {
        warpSpeed += (1.0 - warpSpeed) * 0.05;
    }

    // Clear frame with semi-transparent black layer to produce organic star trails
    ctx.fillStyle = 'rgba(2, 2, 5, 0.25)';
    ctx.fillRect(0, 0, width, height);

    // Pre-calculate rendering trigonometric matrices
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);

    // Project 3D coordinates into 2D display space
    let renderedStars = [];
    for (let i = 0; i < stars.length; i++) {
        stars[i].update();
        let proj = stars[i].project(cosX, sinX, cosY, sinY);

        if (proj.x >= 0 && proj.x <= width && proj.y >= 0 && proj.y <= height) {
            renderedStars.push({
                x: proj.x,
                y: proj.y,
                size: proj.size,
                depth: proj.depth,
                color: `rgba(${Math.floor(stars[i].r)}, ${Math.floor(stars[i].g)}, ${Math.floor(stars[i].b)}, ${Math.min(1, proj.size)})`
            });
        }
    }

    // Depth Sort Algorithm (Painter's Algorithm)
    renderedStars.sort((a, b) => b.depth - a.depth);

    // Batch rendering pipeline execution
    for (let i = 0; i < renderedStars.length; i++) {
        const s = renderedStars[i];
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.1, s.size), 0, Math.PI * 2);
        ctx.fill();
    }

    // Generate Supermassive Black Hole core bright energy glow anchor
    const coreScale = 600 / (600 + (0 * cosX) + 700);
    const centerX = width / 2;
    const centerY = height / 2;

    let glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, CORE_GLOW_RADIUS * coreScale);
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.2, 'rgba(255, 190, 255, 0.6)');
    glow.addColorStop(0.5, 'rgba(110, 130, 255, 0.2)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, CORE_GLOW_RADIUS * coreScale, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(loop);
}

// Initialize execution setup
loop();
