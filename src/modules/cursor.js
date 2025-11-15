// Enhanced Magnetic Cursor with Multiple Effects
// Idle animations, magnetic attraction, and interactive tricks

export class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.cursorInner = document.querySelector('.cursor-inner');
        this.cursorTrail = document.querySelector('.cursor-trail');

        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.cursorX = this.mouseX;
        this.cursorY = this.mouseY;
        this.trailX = this.mouseX;
        this.trailY = this.mouseY;

        this.hoveredElement = null;
        this.idleTime = 0;
        this.isIdle = false;
        this.lastMoveTime = Date.now();

        // Cursor particles for trail effect
        this.particles = [];
        this.maxParticles = 20;

        // Create cursor particles
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'cursor-particle';
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: var(--vibrant-orange);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9998;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(particle);
            this.particles.push({
                element: particle,
                x: this.mouseX,
                y: this.mouseY,
                vx: 0,
                vy: 0
            });
        }

        this.init();
    }

    init() {
        // Track mouse position
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.lastMoveTime = Date.now();
            this.isIdle = false;
            this.idleTime = 0;
        });

        // Detect hover on interactive elements
        const interactiveElements = document.querySelectorAll(
            'a, button, .feature-card, .gallery-item, .nav-link, .form-input, [data-cursor-text]'
        );

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('hover');
                this.hoveredElement = el;

                // Show cursor text if data attribute exists
                const cursorText = el.dataset.cursorText;
                if (cursorText) {
                    this.showCursorText(cursorText);
                }
            });

            el.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('hover');
                this.hoveredElement = null;
                this.hideCursorText();
            });
        });

        // Click effect
        document.addEventListener('mousedown', () => {
            this.cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
            this.createClickRipple();
        });

        document.addEventListener('mouseup', () => {
            this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        // Start animation loop
        this.animate();

        // Check for idle state
        setInterval(() => this.checkIdle(), 100);
    }

    checkIdle() {
        const timeSinceMove = Date.now() - this.lastMoveTime;
        if (timeSinceMove > 2000 && !this.isIdle) {
            this.isIdle = true;
            this.startIdleAnimation();
        }
    }

    startIdleAnimation() {
        // Create orbital particles around cursor when idle
        if (this.isIdle) {
            const angle = this.idleTime * 0.05;
            const radius = 30;

            this.particles.forEach((particle, i) => {
                const particleAngle = angle + (i / this.maxParticles) * Math.PI * 2;
                const x = this.cursorX + Math.cos(particleAngle) * radius;
                const y = this.cursorY + Math.sin(particleAngle) * radius;

                particle.element.style.left = `${x}px`;
                particle.element.style.top = `${y}px`;
                particle.element.style.opacity = '0.6';
            });

            this.idleTime++;
            requestAnimationFrame(() => {
                if (this.isIdle) this.startIdleAnimation();
            });
        } else {
            // Hide particles when not idle
            this.particles.forEach(particle => {
                particle.element.style.opacity = '0';
            });
        }
    }

    createClickRipple() {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            left: ${this.mouseX}px;
            top: ${this.mouseY}px;
            width: 0;
            height: 0;
            border: 2px solid var(--vibrant-orange);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9997;
            transform: translate(-50%, -50%);
            animation: rippleEffect 0.6s ease-out forwards;
        `;

        document.body.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    showCursorText(text) {
        let textEl = document.querySelector('.cursor-text');
        if (!textEl) {
            textEl = document.createElement('div');
            textEl.className = 'cursor-text';
            document.body.appendChild(textEl);
        }
        textEl.textContent = text;
        textEl.style.opacity = '1';
    }

    hideCursorText() {
        const textEl = document.querySelector('.cursor-text');
        if (textEl) {
            textEl.style.opacity = '0';
        }
    }

    animate() {
        // Smooth cursor follow with easing
        const ease = 0.12;
        this.cursorX += (this.mouseX - this.cursorX) * ease;
        this.cursorY += (this.mouseY - this.cursorY) * ease;

        // Trail follows with more lag
        const trailEase = 0.06;
        this.trailX += (this.mouseX - this.trailX) * trailEase;
        this.trailY += (this.mouseY - this.trailY) * trailEase;

        // Apply positions
        this.cursor.style.left = `${this.cursorX}px`;
        this.cursor.style.top = `${this.cursorY}px`;

        this.cursorTrail.style.left = `${this.trailX}px`;
        this.cursorTrail.style.top = `${this.trailY}px`;

        // Magnetic effect when hovering
        if (this.hoveredElement) {
            const rect = this.hoveredElement.getBoundingClientRect();
            const elementCenterX = rect.left + rect.width / 2;
            const elementCenterY = rect.top + rect.height / 2;

            const deltaX = elementCenterX - this.mouseX;
            const deltaY = elementCenterY - this.mouseY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance < 150) {
                const pull = (150 - distance) / 150 * 0.25;
                this.cursorX += deltaX * pull;
                this.cursorY += deltaY * pull;
            }
        }

        // Create trail effect particles (only when moving)
        if (!this.isIdle && Math.abs(this.mouseX - this.cursorX) > 1) {
            this.updateTrailParticles();
        }

        requestAnimationFrame(() => this.animate());
    }

    updateTrailParticles() {
        // Cycle through particles and position them along the trail
        const particleIndex = Math.floor(Date.now() / 50) % this.maxParticles;
        const particle = this.particles[particleIndex];

        particle.x = this.cursorX;
        particle.y = this.cursorY;
        particle.element.style.left = `${particle.x}px`;
        particle.element.style.top = `${particle.y}px`;
        particle.element.style.opacity = '0.4';

        // Fade out
        setTimeout(() => {
            particle.element.style.opacity = '0';
        }, 300);
    }

    getPosition() {
        return {
            x: this.cursorX / window.innerWidth,
            y: this.cursorY / window.innerHeight
        };
    }

    getNormalizedPosition() {
        return {
            x: (this.cursorX / window.innerWidth) * 2 - 1,
            y: -(this.cursorY / window.innerHeight) * 2 + 1
        };
    }
}

// Add ripple animation to global styles
if (!document.querySelector('#cursor-animations')) {
    const style = document.createElement('style');
    style.id = 'cursor-animations';
    style.textContent = `
        @keyframes rippleEffect {
            0% {
                width: 0;
                height: 0;
                opacity: 1;
            }
            100% {
                width: 80px;
                height: 80px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
