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

        // Physics-based velocity for smooth movement
        this.velocityX = 0;
        this.velocityY = 0;
        this.friction = 0.85;

        this.hoveredElement = null;
        this.magneticElements = [];
        this.idleTime = 0;
        this.isIdle = false;
        this.lastMoveTime = Date.now();

        // Cursor particles for trail effect
        this.particles = [];
        this.maxParticles = 15;

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

        // Find all magnetic elements (interactive elements with physics-based attraction)
        const magneticSelectors = 'a, button, .feature-card, .gallery-item, .nav-link, .cta-button, .form-input, [data-magnetic]';
        const magneticElements = document.querySelectorAll(magneticSelectors);

        magneticElements.forEach(el => {
            // Store reference for magnetic effects
            this.magneticElements.push(el);

            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('hover');
                this.hoveredElement = el;

                // Show cursor text if data attribute exists
                const cursorText = el.dataset.cursorText;
                if (cursorText) {
                    this.showCursorText(cursorText);
                }

                // Apply magnetic effect to the element itself
                el.dataset.magneticActive = 'true';
            });

            el.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('hover');
                this.hoveredElement = null;
                this.hideCursorText();

                el.dataset.magneticActive = 'false';
                // Reset element position smoothly
                if (el.style.transform) {
                    el.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
                    el.style.transform = '';
                    setTimeout(() => {
                        el.style.transition = '';
                    }, 500);
                }
            });

            // Track mouse movement over magnetic elements for distortion effect
            el.addEventListener('mousemove', (e) => {
                if (el.dataset.magneticActive === 'true') {
                    const rect = el.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;

                    const deltaX = e.clientX - centerX;
                    const deltaY = e.clientY - centerY;

                    // Apply subtle distortion to the element itself
                    const strength = 0.2;
                    el.style.transform = `translate(${deltaX * strength}px, ${deltaY * strength}px)`;
                }
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
        // Calculate target position with magnetic attraction
        let targetX = this.mouseX;
        let targetY = this.mouseY;

        // Physics-based magnetic attraction with distance-based falloff
        this.magneticElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elementCenterX = rect.left + rect.width / 2;
            const elementCenterY = rect.top + rect.height / 2;

            const deltaX = elementCenterX - this.mouseX;
            const deltaY = elementCenterY - this.mouseY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Magnetic attraction zone
            const maxDistance = 200;
            const minDistance = 50;

            if (distance < maxDistance) {
                // Distance-based falloff (stronger when closer)
                const distanceRatio = Math.max(0, (maxDistance - distance) / maxDistance);
                const strength = distanceRatio * distanceRatio;  // Quadratic falloff

                // Increase pull when very close
                let pullStrength = strength * 0.15;
                if (distance < minDistance) {
                    pullStrength = 0.35;
                }

                // Apply magnetic force
                targetX += deltaX * pullStrength;
                targetY += deltaY * pullStrength;
            }
        });

        // Physics-based smooth movement with velocity
        const spring = 0.15;
        const dx = targetX - this.cursorX;
        const dy = targetY - this.cursorY;

        this.velocityX += dx * spring;
        this.velocityY += dy * spring;

        // Apply friction
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;

        // Update position
        this.cursorX += this.velocityX;
        this.cursorY += this.velocityY;

        // Trail follows with more lag
        const trailEase = 0.08;
        this.trailX += (this.cursorX - this.trailX) * trailEase;
        this.trailY += (this.cursorY - this.trailY) * trailEase;

        // Apply positions - FIX: center exactly on cursor position
        this.cursor.style.left = `${this.cursorX}px`;
        this.cursor.style.top = `${this.cursorY}px`;

        this.cursorTrail.style.left = `${this.trailX}px`;
        this.cursorTrail.style.top = `${this.trailY}px`;

        // Create trail effect particles (only when moving)
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (!this.isIdle && speed > 0.5) {
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
