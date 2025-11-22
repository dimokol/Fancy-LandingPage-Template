// Enhanced Magnetic Cursor with Multiple Effects
// Idle animations, magnetic attraction, and interactive tricks

export class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.cursorInner = document.querySelector('.cursor-inner');
        this.cursorTrail = document.querySelector('.cursor-trail');

        // Create SVG cursor with text on circle
        this.createSVGCursor();

        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.cursorX = this.mouseX;
        this.cursorY = this.mouseY;
        this.trailX = this.mouseX;
        this.trailY = this.mouseY;

        // Speed tracking
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;
        this.mouseSpeed = 0;

        this.hoveredElement = null;
        this.magneticElements = [];
        this.isOverMagneticElement = false;
        this.idleTime = 0;
        this.isIdle = false;
        this.isAtEdge = false;
        this.isAtCorner = false;
        this.edgePosition = null; // 'top', 'bottom', 'left', 'right', 'top-left', etc.
        this.lastMoveTime = Date.now();

        // Cursor particles for idle circle and trail
        this.idleParticles = [];
        this.trailParticles = [];
        this.maxParticles = 15;
        this.trailSpawnTimer = 0;
        this.trailSpawnInterval = 30; // ms between trail dots
        this.lastTrailSpawn = Date.now();
        this.idleDotsToRemove = []; // Queue of idle dots to remove sequentially

        // Create idle circle particles - always orange
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'cursor-particle idle';
            particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: var(--vibrant-orange);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9998;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;
            document.body.appendChild(particle);
            this.idleParticles.push({
                element: particle,
                x: 0,
                y: 0,
                index: i,
                active: false
            });
        }

        this.init();
    }

    createSVGCursor() {
        // Create SVG cursor with text on circle path
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '64');
        svg.setAttribute('height', '64');
        svg.setAttribute('viewBox', '0 0 64 64');
        svg.setAttribute('class', 'cursor-svg');
        svg.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            mix-blend-mode: color-dodge;
        `;

        // Create defs for text path
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

        // Create circular path for text - positioned lower on banner
        const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        textPath.setAttribute('id', 'circlePath');
        // Radius 24 for text to sit properly on the banner stroke
        textPath.setAttribute('d', 'M 32,8 A 24,24 0 1,1 31.99,8');
        defs.appendChild(textPath);
        svg.appendChild(defs);

        // Create mask for transparent text
        const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', 'textMask');

        // White background for mask
        const maskBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        maskBg.setAttribute('width', '64');
        maskBg.setAttribute('height', '64');
        maskBg.setAttribute('fill', 'white');
        mask.appendChild(maskBg);

        // Black text for mask (transparent areas)
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('fill', 'black');
        textElement.setAttribute('font-family', 'Ginjo, sans-serif');
        textElement.setAttribute('font-size', '14');
        textElement.setAttribute('font-weight', '700');
        textElement.setAttribute('letter-spacing', '2.15');
        textElement.setAttribute('dy', '4'); // Move text toward banner center

        const textPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
        textPathElement.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#circlePath');
        textPathElement.setAttribute('startOffset', '0%');
        textPathElement.setAttribute('text-anchor', 'start');
        textPathElement.textContent = 'DIMOKOL • DIMOKOL • ';

        textElement.appendChild(textPathElement);
        mask.appendChild(textElement);
        defs.appendChild(mask);

        // Create ring (banner) - dark by default, blend mode for interactions
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', '32');
        ring.setAttribute('cy', '32');
        ring.setAttribute('r', '24');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', 'rgba(26, 26, 26, 0.92)');
        ring.setAttribute('stroke-width', '10');
        ring.setAttribute('mask', 'url(#textMask)');
        ring.setAttribute('class', 'cursor-svg-circle');

        svg.appendChild(ring);

        // Add SVG to cursor element
        this.cursor.appendChild(svg);
        this.cursorSVG = svg;
        this.cursorCircle = ring;
    }

    init() {
        // Track mouse position and speed
        document.addEventListener('mousemove', (e) => {
            // Calculate speed
            const dx = e.clientX - this.mouseX;
            const dy = e.clientY - this.mouseY;
            this.mouseSpeed = Math.sqrt(dx * dx + dy * dy);

            this.prevMouseX = this.mouseX;
            this.prevMouseY = this.mouseY;

            this.mouseX = e.clientX;
            this.mouseY = e.clientY;

            // Check if at screen edge (within 5px)
            const edgeThreshold = 5;
            const wasAtEdge = this.isAtEdge;
            this.isAtEdge = false;
            this.edgePosition = null;
            this.isAtCorner = false;

            const atLeft = e.clientX <= edgeThreshold;
            const atRight = e.clientX >= window.innerWidth - edgeThreshold;
            const atTop = e.clientY <= edgeThreshold;
            const atBottom = e.clientY >= window.innerHeight - edgeThreshold;

            // Check for corners first
            if (atLeft && atTop) {
                this.isAtEdge = true;
                this.isAtCorner = true;
                this.edgePosition = 'top-left';
            } else if (atRight && atTop) {
                this.isAtEdge = true;
                this.isAtCorner = true;
                this.edgePosition = 'top-right';
            } else if (atLeft && atBottom) {
                this.isAtEdge = true;
                this.isAtCorner = true;
                this.edgePosition = 'bottom-left';
            } else if (atRight && atBottom) {
                this.isAtEdge = true;
                this.isAtCorner = true;
                this.edgePosition = 'bottom-right';
            } else if (atLeft) {
                this.isAtEdge = true;
                this.edgePosition = 'left';
            } else if (atRight) {
                this.isAtEdge = true;
                this.edgePosition = 'right';
            } else if (atTop) {
                this.isAtEdge = true;
                this.edgePosition = 'top';
            } else if (atBottom) {
                this.isAtEdge = true;
                this.edgePosition = 'bottom';
            }

            const wasIdle = this.isIdle;
            this.lastMoveTime = Date.now();
            this.isIdle = false;
            this.idleTime = 0;

            // If transitioning from idle to moving, prepare to remove idle dots sequentially
            if (wasIdle) {
                // All idle dots are candidates for removal as trail dots spawn
                this.idleDotsToRemove = [...this.idleParticles.filter(p => p.active)];
            }
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
                this.isOverMagneticElement = true;

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
                this.isOverMagneticElement = false;

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
            this.cursor.classList.add('hover');
            this.createClickRipple();
        });

        document.addEventListener('mouseup', () => {
            this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            // Only remove hover class if not over a magnetic element
            if (!this.isOverMagneticElement) {
                this.cursor.classList.remove('hover');
            }
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
            if (this.isAtEdge) {
                this.startEdgeIdleAnimation();
            } else {
                this.startIdleAnimation();
            }
        }
    }

    startIdleAnimation() {
        // Create orbital particles around cursor when idle with subtle speed variation
        if (this.isIdle && !this.isAtEdge) {
            // Subtle speed variation using sine wave - less dramatic changes
            const speedVariation = Math.sin(this.idleTime * 0.015) * 0.15 + 1;
            const angle = this.idleTime * 0.05 * speedVariation;
            const radius = 35;

            this.idleParticles.forEach((particle, i) => {
                const particleAngle = angle + (i / this.maxParticles) * Math.PI * 2;
                const x = this.cursorX + Math.cos(particleAngle) * radius - 2;
                const y = this.cursorY + Math.sin(particleAngle) * radius - 2;

                particle.x = x;
                particle.y = y;
                particle.element.style.left = `${x}px`;
                particle.element.style.top = `${y}px`;
                particle.element.style.opacity = '0.6';
                particle.active = true;
            });

            this.idleTime++;
            requestAnimationFrame(() => {
                if (this.isIdle && !this.isAtEdge) this.startIdleAnimation();
            });
        }
    }

    startEdgeIdleAnimation() {
        // Energy emission effect - emit particles like rays/explosions
        if (this.isIdle && this.isAtEdge) {
            if (this.isAtCorner) {
                // Corner animation - radial burst in quarter circle
                this.idleParticles.forEach((particle, i) => {
                    // Determine corner quadrant
                    let baseAngle;
                    switch (this.edgePosition) {
                        case 'top-left':
                            baseAngle = Math.PI / 4; // 45 degrees, pointing down-right
                            break;
                        case 'top-right':
                            baseAngle = Math.PI * 3/4; // 135 degrees, pointing down-left
                            break;
                        case 'bottom-left':
                            baseAngle = -Math.PI / 4; // -45 degrees, pointing up-right
                            break;
                        case 'bottom-right':
                            baseAngle = Math.PI * 5/4; // 225 degrees, pointing up-left
                            break;
                        default:
                            baseAngle = 0;
                    }

                    // Spread particles in a quarter-circle (90 degrees) centered on diagonal
                    const spreadRange = Math.PI / 2; // 90 degrees
                    const angleOffset = (i / this.maxParticles) * spreadRange - spreadRange / 2;
                    const particleAngle = baseAngle + angleOffset;

                    // Ripple wave effect - particles pulse out in waves
                    const wavePhase = (this.idleTime * 0.1 + i * 0.4) % (Math.PI * 2);
                    const emissionDistance = 15 + Math.sin(wavePhase) * 30;

                    const x = this.cursorX + Math.cos(particleAngle) * emissionDistance - 2;
                    const y = this.cursorY + Math.sin(particleAngle) * emissionDistance - 2;

                    // Wave opacity
                    const pulseOpacity = 0.2 + Math.abs(Math.sin(wavePhase)) * 0.6;

                    particle.x = x;
                    particle.y = y;
                    particle.element.style.left = `${x}px`;
                    particle.element.style.top = `${y}px`;
                    particle.element.style.opacity = pulseOpacity.toString();
                    particle.active = true;
                });
            } else {
                // Side/edge animation - emit particles like rays
                let emissionAngleStart, emissionAngleEnd;

                switch (this.edgePosition) {
                    case 'left':
                        emissionAngleStart = -Math.PI / 3; // Emit to the right
                        emissionAngleEnd = Math.PI / 3;
                        break;
                    case 'right':
                        emissionAngleStart = Math.PI * 2/3; // Emit to the left
                        emissionAngleEnd = Math.PI * 4/3;
                        break;
                    case 'top':
                        emissionAngleStart = Math.PI / 6; // Emit downward
                        emissionAngleEnd = Math.PI * 5/6;
                        break;
                    case 'bottom':
                        emissionAngleStart = Math.PI * 7/6; // Emit upward
                        emissionAngleEnd = Math.PI * 11/6;
                        break;
                    default:
                        emissionAngleStart = 0;
                        emissionAngleEnd = Math.PI * 2;
                }

                this.idleParticles.forEach((particle, i) => {
                    // Each particle moves outward like a ray
                    const angleRange = emissionAngleEnd - emissionAngleStart;
                    const particleAngle = emissionAngleStart + (i / this.maxParticles) * angleRange;

                    // Pulsing emission distance
                    const pulsePhase = (this.idleTime * 0.08 + i * 0.2) % (Math.PI * 2);
                    const emissionDistance = 20 + Math.sin(pulsePhase) * 25;

                    const x = this.cursorX + Math.cos(particleAngle) * emissionDistance - 2;
                    const y = this.cursorY + Math.sin(particleAngle) * emissionDistance - 2;

                    // Pulsing opacity synchronized with emission
                    const pulseOpacity = 0.3 + Math.abs(Math.sin(pulsePhase)) * 0.5;

                    particle.x = x;
                    particle.y = y;
                    particle.element.style.left = `${x}px`;
                    particle.element.style.top = `${y}px`;
                    particle.element.style.opacity = pulseOpacity.toString();
                    particle.active = true;
                });
            }

            this.idleTime++;
            requestAnimationFrame(() => {
                if (this.isIdle && this.isAtEdge) this.startEdgeIdleAnimation();
            });
        }
    }

    spawnTrailDot() {
        // Create a new trail dot at current cursor position - always orange
        const trailDot = document.createElement('div');
        trailDot.className = 'cursor-particle trail';
        trailDot.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: var(--vibrant-orange);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            left: ${this.cursorX}px;
            top: ${this.cursorY}px;
            opacity: 0.6;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(trailDot);

        const spawnTime = Date.now();
        this.trailParticles.push({
            element: trailDot,
            spawnTime: spawnTime
        });

        // Remove one idle dot sequentially if any are queued
        if (this.idleDotsToRemove.length > 0) {
            const dotToRemove = this.idleDotsToRemove.shift();
            dotToRemove.element.style.opacity = '0';
            dotToRemove.active = false;
        }

        // Fade out and remove trail dot after delay
        setTimeout(() => {
            trailDot.style.opacity = '0';
            setTimeout(() => {
                trailDot.remove();
                const index = this.trailParticles.findIndex(p => p.element === trailDot);
                if (index > -1) {
                    this.trailParticles.splice(index, 1);
                }

                // Check if we should fade remaining idle dots
                this.checkFadeRemainingIdleDots();
            }, 300);
        }, 600); // Trail dots visible for 600ms
    }

    checkFadeRemainingIdleDots() {
        // If cursor stopped moving and all trail dots are gone, fade remaining idle dots sequentially
        if (this.mouseSpeed < 0.1 && this.trailParticles.length === 0) {
            const activeIdleDots = this.idleParticles.filter(p => p.active);
            activeIdleDots.forEach((dot, i) => {
                setTimeout(() => {
                    dot.element.style.opacity = '0';
                    dot.active = false;
                }, i * 60); // 60ms between each fade
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

        // INSTANT FOLLOW - Cursor follows mouse directly with minimal lag (no bounce)
        const cursorEase = this.isOverMagneticElement ? 0.3 : 0.5;  // Snappier when magnetized
        this.cursorX += (targetX - this.cursorX) * cursorEase;
        this.cursorY += (targetY - this.cursorY) * cursorEase;

        // Trail follows with more lag
        const trailEase = 0.08;
        this.trailX += (this.cursorX - this.trailX) * trailEase;
        this.trailY += (this.cursorY - this.trailY) * trailEase;

        // Decay speed
        this.mouseSpeed *= 0.92;

        // Apply positions - center exactly on cursor position
        this.cursor.style.left = `${this.cursorX}px`;
        this.cursor.style.top = `${this.cursorY}px`;

        this.cursorTrail.style.left = `${this.trailX}px`;
        this.cursorTrail.style.top = `${this.trailY}px`;

        // Spawn trail dots when moving (not idle)
        if (!this.isIdle && this.mouseSpeed > 1) {
            const now = Date.now();
            if (now - this.lastTrailSpawn >= this.trailSpawnInterval) {
                this.spawnTrailDot();
                this.lastTrailSpawn = now;
            }
        }

        requestAnimationFrame(() => this.animate());
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
