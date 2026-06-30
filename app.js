// --- Configuration & Constants ---
const TOTAL_FRAMES = 194;
const IMAGES_CACHE = [];
let loadedImagesCount = 0;

// DOM Elements
const canvas = document.getElementById('animation-canvas');
const context = canvas.getContext('2d');
const loader = document.getElementById('loader');
const loadBar = document.getElementById('load-bar');
const loadPercentage = document.getElementById('load-percentage');
const loadStatus = document.getElementById('load-status');

// --- Helper Functions ---
const getFramePath = (index) => {
    // Frames are 1-indexed (001 to 194)
    const frameNum = String(index).padStart(3, '0');
    return `ezgif/ezgif-frame-${frameNum}.jpg`;
};

// Handle Canvas Sizing (Retina/High-DPI support)
const resizeCanvas = () => {
    const scale = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    if (canvas.width !== width * scale || canvas.height !== height * scale) {
        canvas.width = width * scale;
        canvas.height = height * scale;
        context.scale(scale, scale);
    }
    
    // Redraw the current frame after resize
    drawFrame(currentFrame);
};

// Draw Image Centered & Aspect Ratio Cover
const drawImageProp = (ctx, img, x, y, w, h) => {
    if (!img || !img.complete) return;
    
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    
    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = w / h;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    // Fit canvas (Cover mode)
    if (imgRatio > canvasRatio) {
        drawHeight = h;
        drawWidth = h * imgRatio;
        drawX = x + (w - drawWidth) / 2;
        drawY = y;
    } else {
        drawWidth = w;
        drawHeight = w / imgRatio;
        drawX = x;
        drawY = y + (h - drawHeight) / 2;
    }
    
    ctx.clearRect(x, y, w, h);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
};

// --- GSAP Scroll-Triggered State Machine Configuration ---
const STATE_INITIAL = 'INITIAL';
const STATE_ANIMATING = 'ANIMATING';
const STATE_COMPLETED = 'COMPLETED';
const STATE_TRANSITIONING = 'TRANSITIONING';
const STATE_NORMAL = 'NORMAL';

let currentState = STATE_INITIAL;
let currentFrame = 0;

// Draw a specific frame index
const drawFrame = (index) => {
    const img = IMAGES_CACHE[index];
    if (img) {
        drawImageProp(context, img, 0, 0, canvas.clientWidth, canvas.clientHeight);
    }
};

// Play the full 3D intro animation
const playHeroAnimation = () => {
    if (currentState !== STATE_INITIAL) return;
    currentState = STATE_ANIMATING;

    // Fade out the hero text overlay
    const heroOverlay = document.querySelector('.hero-overlay');
    if (heroOverlay) {
        heroOverlay.style.opacity = '0';
        heroOverlay.style.transform = 'translateY(-30px)';
    }

    const animObject = { frame: 0 };
    gsap.to(animObject, {
        frame: TOTAL_FRAMES - 1,
        duration: 3.5, // 3.5 seconds for a premium, smooth flow
        ease: "power1.inOut",
        onUpdate: () => {
            currentFrame = Math.floor(animObject.frame);
            drawFrame(currentFrame);
        },
        onComplete: () => {
            currentState = STATE_COMPLETED;
        }
    });
};

// Reset hero animation state back to initial
const resetAnimation = () => {
    currentState = STATE_INITIAL;
    currentFrame = 0;
    
    // Fade in the hero text overlay
    const heroOverlay = document.querySelector('.hero-overlay');
    if (heroOverlay) {
        heroOverlay.style.opacity = '1';
        heroOverlay.style.transform = 'translateY(0)';
    }
    
    drawFrame(0);
};

// Smooth transition to About section
const transitionToAbout = () => {
    if (currentState !== STATE_COMPLETED) return;
    currentState = STATE_TRANSITIONING;
    
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        gsap.to(window, {
            duration: 1.2,
            scrollTo: { y: aboutSection, autoKill: false },
            ease: "power2.inOut",
            onComplete: () => {
                currentState = STATE_NORMAL;
            }
        });
    } else {
        currentState = STATE_NORMAL;
    }
};

// Single Master Event Handlers for Intercepting Wheel, Keyboard, and Touch Scroll Attempts
const handleWheel = (e) => {
    if (currentState === STATE_INITIAL) {
        e.preventDefault();
        if (e.deltaY > 0) {
            playHeroAnimation();
        }
    } else if (currentState === STATE_ANIMATING || currentState === STATE_TRANSITIONING) {
        e.preventDefault();
    } else if (currentState === STATE_COMPLETED) {
        if (e.deltaY > 0) {
            e.preventDefault();
            transitionToAbout();
        } else if (e.deltaY < 0) {
            // Keep at top if scrolling up
            e.preventDefault();
        }
    }
};

const handleKeyDown = (e) => {
    const scrollKeys = [32, 33, 34, 35, 36, 38, 40]; // Space, PageUp, PageDown, End, Home, Up, Down
    if (scrollKeys.includes(e.keyCode)) {
        if (currentState === STATE_INITIAL) {
            e.preventDefault();
            const isDown = [32, 34, 40, 35].includes(e.keyCode);
            if (isDown) {
                playHeroAnimation();
            }
        } else if (currentState === STATE_ANIMATING || currentState === STATE_TRANSITIONING) {
            e.preventDefault();
        } else if (currentState === STATE_COMPLETED) {
            e.preventDefault();
            const isDown = [32, 34, 40, 35].includes(e.keyCode);
            if (isDown) {
                transitionToAbout();
            }
        }
    }
};

let touchStartY = 0;
const handleTouchStart = (e) => {
    touchStartY = e.touches[0].clientY;
};

const handleTouchMove = (e) => {
    if (currentState !== STATE_NORMAL) {
        const touchEndY = e.touches[0].clientY;
        const diffY = touchStartY - touchEndY;
        const isScrollingDown = diffY > 10;
        
        if (currentState === STATE_INITIAL) {
            e.preventDefault();
            if (isScrollingDown) {
                playHeroAnimation();
            }
        } else if (currentState === STATE_ANIMATING || currentState === STATE_TRANSITIONING) {
            e.preventDefault();
        } else if (currentState === STATE_COMPLETED) {
            e.preventDefault();
            if (isScrollingDown) {
                transitionToAbout();
            }
        }
    }
};

// Register Event Listeners
window.addEventListener('wheel', handleWheel, { passive: false });
window.addEventListener('keydown', handleKeyDown, { passive: false });
window.addEventListener('touchstart', handleTouchStart, { passive: true });
window.addEventListener('touchmove', handleTouchMove, { passive: false });

// --- Interactive 3D Bubble Cursor Effect ---
const initBubbleCursor = () => {
    const cursorCanvas = document.getElementById('cursor-canvas');
    if (!cursorCanvas) return;
    const ctx = cursorCanvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const resizeCursorCanvas = () => {
        const scale = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        cursorCanvas.width = width * scale;
        cursorCanvas.height = height * scale;
        ctx.scale(scale, scale);
    };
    
    window.addEventListener('resize', resizeCursorCanvas);
    resizeCursorCanvas();
    
    const bubbles = [];
    const maxBubbles = 70;
    
    const mouse = {
        x: -999,
        y: -999,
        vx: 0,
        vy: 0,
        lastX: 0,
        lastY: 0,
        active: false
    };
    
    const colors = [
        { r: 255, g: 107, b: 0 },   // Neon Orange
        { r: 0,   g: 217, b: 255 }, // Neon Blue
        { r: 255, g: 20,  b: 147 }, // Neon Pink
        { r: 255, g: 255, b: 255 }  // White
    ];
    
    class Bubble {
        constructor(x, y, vx, vy) {
            this.x = x;
            this.y = y;
            
            // Inertia from mouse vector + floating forces
            this.vx = vx * 0.12 + (Math.random() - 0.5) * 1.2;
            this.vy = vy * 0.12 - (Math.random() * 2 + 0.8);
            
            this.maxRadius = Math.random() * 11 + 5;
            this.radius = 0;
            this.growSpeed = Math.random() * 0.6 + 0.4;
            
            this.alpha = 1.0;
            this.fadeSpeed = Math.random() * 0.016 + 0.012;
            
            this.wobbleSpeed = Math.random() * 0.06 + 0.03;
            this.wobbleScale = Math.random() * 3 + 1.5;
            this.wobbleOffset = Math.random() * Math.PI * 2;
            this.age = 0;
            
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }
        
        update() {
            this.age++;
            
            if (this.radius < this.maxRadius) {
                this.radius += this.growSpeed;
            }
            
            const drift = Math.sin(this.age * this.wobbleSpeed + this.wobbleOffset) * this.wobbleScale * 0.06;
            this.x += this.vx + drift;
            this.y += this.vy;
            
            this.alpha -= this.fadeSpeed;
            return this.alpha > 0;
        }
        
        draw(c) {
            c.save();
            c.globalAlpha = this.alpha;
            
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const stretch = Math.min(1 + speed * 0.04, 1.3);
            const squish = 1 / Math.sqrt(stretch);
            
            c.translate(this.x, this.y);
            const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
            c.rotate(angle);
            c.scale(squish, stretch);
            
            const grad = c.createRadialGradient(
                -this.radius * 0.22, -this.radius * 0.22, this.radius * 0.08,
                0, 0, this.radius
            );
            
            const borderCol = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`;
            
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(0.25, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.38)`);
            grad.addColorStop(0.85, 'rgba(10, 10, 15, 0.12)');
            grad.addColorStop(0.98, borderCol);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            c.beginPath();
            c.arc(0, 0, this.radius, 0, Math.PI * 2);
            c.fillStyle = grad;
            c.fill();
            
            c.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${0.3 * this.alpha})`;
            c.lineWidth = 0.8;
            c.stroke();
            
            c.restore();
        }
    }
    
    const drawCustomCursorDot = () => {
        if (!mouse.active || mouse.x < 0 || mouse.y < 0) return;
        
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 107, 0, 0.6)';
        
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 107, 0, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        
        ctx.restore();
    };
    
    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        
        if (mouse.active) {
            const dist = Math.hypot(mouse.x - mouse.lastX, mouse.y - mouse.lastY);
            if (dist > 7 && bubbles.length < maxBubbles) {
                const vx = mouse.x - mouse.lastX;
                const vy = mouse.y - mouse.lastY;
                
                bubbles.push(new Bubble(mouse.x, mouse.y, vx, vy));
                
                mouse.lastX = mouse.x;
                mouse.lastY = mouse.y;
            }
        }
        
        for (let i = bubbles.length - 1; i >= 0; i--) {
            const bubble = bubbles[i];
            if (bubble.update()) {
                bubble.draw(ctx);
            } else {
                bubbles.splice(i, 1);
            }
        }
        
        drawCustomCursorDot();
        requestAnimationFrame(animate);
    };
    
    window.addEventListener('mousemove', (e) => {
        mouse.active = true;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        if (mouse.lastX === 0 && mouse.lastY === 0) {
            mouse.lastX = mouse.x;
            mouse.lastY = mouse.y;
        }
    });
    
    window.addEventListener('mouseout', () => {
        mouse.active = false;
    });
    
    window.addEventListener('click', (e) => {
        const count = Math.random() * 6 + 5;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const force = Math.random() * 8 + 3;
            const vx = Math.cos(angle) * force;
            const vy = Math.sin(angle) * force;
            bubbles.push(new Bubble(e.clientX, e.clientY, vx, vy));
        }
    });
    
    animate();
};

// --- Initialization / Preloading ---
const handleNavLinkClick = (e, targetId) => {
    e.preventDefault();
    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;
    
    if (targetId === '#home') {
        currentState = STATE_TRANSITIONING;
        gsap.to(window, {
            duration: 1.2,
            scrollTo: { y: 0, autoKill: false },
            ease: "power2.inOut",
            onComplete: () => {
                resetAnimation();
            }
        });
        return;
    }
    
    if (currentState === STATE_INITIAL) {
        // First play the animation, then scroll to target
        currentState = STATE_ANIMATING;
        
        const heroOverlay = document.querySelector('.hero-overlay');
        if (heroOverlay) {
            heroOverlay.style.opacity = '0';
            heroOverlay.style.transform = 'translateY(-30px)';
        }

        const animObject = { frame: 0 };
        gsap.to(animObject, {
            frame: TOTAL_FRAMES - 1,
            duration: 2.0, // Speed up slightly when user clicks a link directly
            ease: "power1.inOut",
            onUpdate: () => {
                currentFrame = Math.floor(animObject.frame);
                drawFrame(currentFrame);
            },
            onComplete: () => {
                currentState = STATE_TRANSITIONING;
                gsap.to(window, {
                    duration: 1.2,
                    scrollTo: { y: targetEl, autoKill: false },
                    ease: "power2.inOut",
                    onComplete: () => {
                        currentState = STATE_NORMAL;
                    }
                });
            }
        });
    } else if (currentState === STATE_ANIMATING || currentState === STATE_TRANSITIONING) {
        // Block other navigation attempts while busy
    } else {
        // STATE_COMPLETED or STATE_NORMAL
        currentState = STATE_TRANSITIONING;
        gsap.to(window, {
            duration: 1.2,
            scrollTo: { y: targetEl, autoKill: false },
            ease: "power2.inOut",
            onComplete: () => {
                currentState = STATE_NORMAL;
            }
        });
    }
};

const startApp = () => {
    // Hide loader
    loader.classList.add('loaded');
    
    // Ensure we start at scroll top 0 on page load/refresh
    window.scrollTo(0, 0);
    
    // Setup resize listener and trigger initial size
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Initial draw of frame 0
    drawFrame(0);
    
    // Setup Scroll Reveal Intersection Observer for portfolio sections
    const observerOptions = {
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    
    // Interactive Glow Follow (Micro-interaction coords updater)
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        document.documentElement.style.setProperty('--mouse-x', x);
        document.documentElement.style.setProperty('--mouse-y', y);
    });

    // Setup smooth scrolling for anchor links pointing to page element IDs
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            handleNavLinkClick(e, targetId);
        });
    });

    // Setup smooth scroll for Return to Surface footer button
    const btnReturn = document.getElementById('btn-return-to-surface');
    if (btnReturn) {
        btnReturn.addEventListener('click', (e) => {
            e.preventDefault();
            currentState = STATE_TRANSITIONING;
            gsap.to(window, {
                duration: 1.2,
                scrollTo: { y: 0, autoKill: false },
                ease: "power2.inOut",
                onComplete: () => {
                    resetAnimation();
                }
            });
        });
    }

    // Initialize 3D Bubble Cursor
    initBubbleCursor();
};

const preloadImages = () => {
    loadStatus.textContent = "Loading asset sequence...";
    
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getFramePath(i);
        
        img.onload = () => {
            loadedImagesCount++;
            const pct = Math.round((loadedImagesCount / TOTAL_FRAMES) * 100);
            
            // Update loading visual progress
            loadPercentage.textContent = `${pct}%`;
            loadBar.style.width = `${pct}%`;
            
            if (loadedImagesCount === TOTAL_FRAMES) {
                setTimeout(startApp, 400); // Visual buffer for loading fade-out transition
            }
        };
        
        img.onerror = () => {
            console.error(`Failed to load frame ${i} at ${img.src}`);
            loadedImagesCount++;
            if (loadedImagesCount === TOTAL_FRAMES) {
                setTimeout(startApp, 400);
            }
        };
        
        IMAGES_CACHE.push(img);
    }
};

// Execute Preloading on Load
window.addEventListener('DOMContentLoaded', preloadImages);
