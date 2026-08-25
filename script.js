const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const statusMessage = document.getElementById('statusMessage');
const rootElement = document.documentElement;

// Particle engine parameters
const PARTICLE_COUNT = 150;
let particles = [];
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

// Default Theme Colors (Deep Cyber Space Blue & Hot Magenta Pink)
let themeColors = {
    primary: { r: 59, g: 130, b: 246 },     // #3b82f6
    secondary: { r: 255, g: 123, b: 242 },  // #ff7bf2
    darkBg: { r: 2, g: 2, b: 5 }
};

// Automatic window rescaling adjustment anchor
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

// Particle Entity Blueprint Class
class CosmicParticle {
    constructor() {
        this.reset();
        // Distribute randomly across screen upon initialization
        this.x = Math.random() * width;
        this.y = Math.random() * height;
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.5 + 0.5;
        // Non-interactive background drifts at constant slow speeds
        this.speedX = (Math.random() - 0.5) * 0.15;
        this.speedY = (Math.random() - 0.5) * 0.15;
        // Set variations of glowing visibility lifetimes
        this.opacity = Math.random() * 0.5 + 0.1;
        this.fadeSpeed = Math.random() * 0.005 + 0.002;
        this.fadeDirection = Math.random() > 0.5 ? 1 : -1;
        // Randomly pick color variant assignments
        this.colorType = Math.random() > 0.4 ? 'primary' : 'secondary';
    }

    update() {
        // Drift slowly through canvas coordinate boundaries
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around boundaries gracefully if floating outside edge screens
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.reset();
            if (Math.random() > 0.5) this.x = this.speedX > 0 ? 0 : width;
            else this.y = this.speedY > 0 ? 0 : height;
        }

        // Shimmer pulse animation logic loop
        this.opacity += this.fadeSpeed * this.fadeDirection;
        if (this.opacity >= 0.7) {
            this.opacity = 0.7;
            this.fadeDirection = -1;
        } else if (this.opacity <= 0.1) {
            this.opacity = 0.1;
            this.fadeDirection = 1;
        }
    }

    draw() {
        const c = themeColors[this.colorType];
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Populate structural particle buffer
for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new CosmicParticle());
}

// Core Rendering Loop Function
function renderEngineLoop() {
    // Generate background color gradients
    const bgGradient = ctx.createRadialGradient(
        width / 2, height / 2, 10,
        width / 2, height / 2, Math.max(width, height) * 0.8
    );
    
    // Smooth custom blend color anchors matching user themes
    bgGradient.addColorStop(0, `rgba(${themeColors.secondary.r}, ${themeColors.secondary.g}, ${themeColors.secondary.b}, 0.08)`);
    bgGradient.addColorStop(0.4, `rgba(${themeColors.primary.r}, ${themeColors.primary.g}, ${themeColors.primary.b}, 0.04)`);
    bgGradient.addColorStop(1, `rgba(${themeColors.darkBg.r}, ${themeColors.darkBg.g}, ${themeColors.darkBg.b}, 1)`);

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Render individual cosmic floating dust nodes
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }

    requestAnimationFrame(renderEngineLoop);
}

// Extract Color Theme directly from User Uploaded Images
function extractThemeColors(imageSrc) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    
    img.onload = function() {
        // Use a hidden canvas matrix to sample internal color pixels efficiently
        const hiddenCanvas = document.createElement('canvas');
        const hiddenCtx = hiddenCanvas.getContext('2d');
        hiddenCanvas.width = 40;
        hiddenCanvas.height = 40;
        
        hiddenCtx.drawImage(img, 0, 0, 40, 40);
        const imgData = hiddenCtx.getImageData(0, 0, 40, 40).data;
        
        // Sampling different parts of the image to find diverse matching colors
        let idx1 = Math.floor(imgData.length * 0.25 / 4) * 4;
        let idx2 = Math.floor(imgData.length * 0.75 / 4) * 4;
        
        themeColors.primary = { r: imgData[idx1], g: imgData[idx1+1], b: imgData[idx1+2] };
        themeColors.secondary = { r: imgData[idx2], g: imgData[idx2+1], b: imgData[idx2+2] };
        
        // Darkened background formula adjustments based off extracted choices
        themeColors.darkBg = {
            r: Math.floor(themeColors.primary.r * 0.04),
            g: Math.floor(themeColors.primary.g * 0.04),
            b: Math.floor(themeColors.secondary.b * 0.06 + 3)
        };

        // Update active CSS variables to recolor layout components dynamically
        rootElement.style.setProperty('--theme-primary', `rgb(${themeColors.primary.r}, ${themeColors.primary.g}, ${themeColors.primary.b})`);
        rootElement.style.setProperty('--theme-secondary', `rgb(${themeColors.secondary.r}, ${themeColors.secondary.g}, ${themeColors.secondary.b})`);
    };
}

// LocalStorage Persistence Management Engine
function saveThemeToLocalStorage(base64Data) {
    try {
        localStorage.setItem('user_cosmic_theme_img_bg_only', base64Data);
        statusMessage.textContent = "Theme Saved";
    } catch(err) {
        statusMessage.textContent = "Theme Updated";
    }
}

function loadSavedThemeFromStorage() {
    const savedImg = localStorage.getItem('user_cosmic_theme_img_bg_only');
    if (savedImg) {
        extractThemeColors(savedImg);
       //code i removed
    }
}

// User File Upload Action Event Listeners
imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result;
            extractThemeColors(base64Data);
            saveThemeToLocalStorage(base64Data);
        };
        reader.readAsDataURL(file);
    }
});

// Initialize Setup Routines
loadSavedThemeFromStorage();
renderEngineLoop();
