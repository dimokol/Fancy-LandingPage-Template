// Enhanced Magnetic Cursor with Multiple Effects
// Idle animations, magnetic attraction, and interactive tricks

import { gsap } from 'gsap';

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
        this.idleStartX = 0;
        this.idleStartY = 0;
        this.transitioningFromIdle = false; // Track if we're transitioning but haven't moved enough yet

        // Banner rotation tracking for smooth transitions
        this.bannerRotation = 0;
        this.bannerRotationSpeed = 360 / 12000; // 360 degrees in 12 seconds (normal speed)
        this.targetRotationSpeed = this.bannerRotationSpeed;
        this.lastFrameTime = Date.now();

        // Cursor particles for idle circle and trail
        this.idleParticles = [];
        this.trailParticles = [];
        this.maxParticles = 15;
        // Distance-based trail spawning for consistent spacing
        this.trailSpawnDistance = 15; // pixels between trail dots
        this.lastTrailX = this.mouseX;
        this.lastTrailY = this.mouseY;
        this.idleDotsToRemove = []; // Queue of idle dots to remove sequentially

        // Create a container for trail dots that shares the same blend mode as cursor
        // but stays fixed in the viewport (trails don't move with cursor)
        this.trailContainer = document.createElement('div');
        this.trailContainer.className = 'cursor-trail-container';
        this.trailContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            mix-blend-mode: difference;
        `;
        document.body.appendChild(this.trailContainer);

        // Create idle circle particles - added to cursor element to share its blend mode
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'cursor-particle idle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgb(255, 255, 255);
                border-radius: 50%;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                z-index: -1;
            `;
            // Add to cursor element (inherits mix-blend-mode from cursor)
            this.cursor.appendChild(particle);
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
            pointer-events: none;
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

        // Create ring (banner) - white like center dot, will invert via CSS
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', '32');
        ring.setAttribute('cy', '32');
        ring.setAttribute('r', '24');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', 'rgb(255, 255, 255)');
        ring.setAttribute('stroke-width', '10');
        ring.setAttribute('mask', 'url(#textMask)');
        ring.setAttribute('class', 'cursor-svg-circle');
        ring.style.opacity = '1';
        ring.style.transition = 'opacity 0.2s ease';

        svg.appendChild(ring);

        // Create solid text overlay (hidden by default, shown on hover)
        const solidText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        solidText.setAttribute('fill', 'rgb(255, 255, 255)');
        solidText.setAttribute('font-family', 'Ginjo, sans-serif');
        solidText.setAttribute('font-size', '14');
        solidText.setAttribute('font-weight', '700');
        solidText.setAttribute('letter-spacing', '2.15');
        solidText.setAttribute('dy', '4');
        solidText.setAttribute('class', 'cursor-svg-text-solid');
        solidText.style.opacity = '0';
        solidText.style.transition = 'opacity 0.2s ease';

        const solidTextPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
        solidTextPathElement.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#circlePath');
        solidTextPathElement.setAttribute('startOffset', '0%');
        solidTextPathElement.setAttribute('text-anchor', 'start');
        solidTextPathElement.textContent = 'DIMOKOL • DIMOKOL • ';

        solidText.appendChild(solidTextPathElement);
        svg.appendChild(solidText);

        // Add SVG to cursor element
        this.cursor.appendChild(svg);
        this.cursorSVG = svg;
        this.cursorCircle = ring;
        this.cursorTextSolid = solidText;
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

            // Check if cursor banner is over any content (for switching banner style)
            this.checkBannerOverContent(e.clientX, e.clientY);

            // Check if at screen edge (within 5px)
            const edgeThreshold = 5;
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
            const wasAtEdge = this.isAtEdge;
            this.lastMoveTime = Date.now();

            // If transitioning from idle, mark it and store the edge state
            if (wasIdle) {
                this.transitioningFromIdle = true;
                this.transitionEdgeState = wasAtEdge; // Store whether we were at edge
                this.isIdle = false;
                this.idleTime = 0;
            }

            // Check if we've moved enough distance from idle position to calculate direction
            if (this.transitioningFromIdle) {
                const dx = e.clientX - this.idleStartX;
                const dy = e.clientY - this.idleStartY;
                const distanceMoved = Math.sqrt(dx * dx + dy * dy);

                // Only calculate direction once we've moved at least 20 pixels
                if (distanceMoved >= 20) {
                    const movementAngle = Math.atan2(dy, dx);

                    // If we were at an edge, detach idle dots and leave them behind
                    if (this.transitionEdgeState) {
                        this.detachIdleParticles();
                    } else {
                        // Normal idle (circular): remove dots starting from opposite of movement direction
                        // Add π to get opposite direction (180 degrees)
                        let oppositeAngle = movementAngle + Math.PI;

                        // Normalize to [-π, π] range to match atan2 output
                        if (oppositeAngle > Math.PI) {
                            oppositeAngle -= Math.PI * 2;
                        }

                        this.prepareDirectionalRemoval(oppositeAngle);
                    }

                    // Reset trail spawn position to current cursor position
                    this.lastTrailX = this.mouseX;
                    this.lastTrailY = this.mouseY;
                    this.transitioningFromIdle = false;
                }
            }
        });

        // Find all magnetic elements (interactive elements with physics-based attraction)
        const magneticSelectors = 'a, button, .feature-card, .gallery-item, .nav-logo, .nav-link, .cta-button, .form-input, [data-magnetic]';
        const magneticElements = document.querySelectorAll(magneticSelectors);

        magneticElements.forEach(el => {
            // Store reference for magnetic effects
            this.magneticElements.push(el);

            // Create quickTo functions for smooth, performant updates
            const quickX = gsap.quickTo(el, 'x', {duration: 0.5, ease: 'power3.out'});
            const quickY = gsap.quickTo(el, 'y', {duration: 0.5, ease: 'power3.out'});

            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('hover');
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1.15)';
                this.hoveredElement = el;
                this.isOverMagneticElement = true;

                // Speed up banner rotation (4s = 360/4000 degrees per ms)
                this.targetRotationSpeed = 360 / 4000;

                // Switch to text-only mode (no background ring) on hover
                this.cursorCircle.style.opacity = '0';
                this.cursorTextSolid.style.opacity = '1';

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
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';

                // Switch back to ring with masked text (default mode)
                this.cursorCircle.style.opacity = '1';
                this.cursorTextSolid.style.opacity = '0';
                this.hoveredElement = null;
                this.isOverMagneticElement = false;

                // Slow down banner rotation back to normal (12s = 360/12000 degrees per ms)
                this.targetRotationSpeed = 360 / 12000;

                this.hideCursorText();

                el.dataset.magneticActive = 'false';

                // Reset element position smoothly using GSAP
                gsap.to(el, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: 'power3.out'
                });
            });

            // Track mouse movement over magnetic elements for distortion effect
            el.addEventListener('mousemove', (e) => {
                if (el.dataset.magneticActive === 'true') {
                    const rect = el.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;

                    const deltaX = e.clientX - centerX;
                    const deltaY = e.clientY - centerY;

                    // Apply subtle distortion using GSAP (preserves other transforms)
                    const strength = 0.2;
                    quickX(deltaX * strength);
                    quickY(deltaY * strength);
                }
            });
        });

        // Click effect - smooth scale transition
        document.addEventListener('mousedown', () => {
            this.cursor.style.transform = 'translate(-50%, -50%) scale(0.85)';
            this.createClickRipple();
        });

        document.addEventListener('mouseup', () => {
            // Return to hover state if over magnetic element, otherwise normal state
            if (this.isOverMagneticElement) {
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1.15)';
            } else {
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
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
            // Store position where idle started
            this.idleStartX = this.mouseX;
            this.idleStartY = this.mouseY;
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

            // Cursor center is at 45px, 45px (half of 90x90)
            const cursorCenterX = 45;
            const cursorCenterY = 45;

            this.idleParticles.forEach((particle, i) => {
                const particleAngle = angle + (i / this.maxParticles) * Math.PI * 2;
                // Position relative to cursor element center
                const x = cursorCenterX + Math.cos(particleAngle) * radius - 2;
                const y = cursorCenterY + Math.sin(particleAngle) * radius - 2;

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
            // Cursor center is at 45px, 45px (half of 90x90)
            const cursorCenterX = 45;
            const cursorCenterY = 45;

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

                    // Position relative to cursor element center
                    const x = cursorCenterX + Math.cos(particleAngle) * emissionDistance - 2;
                    const y = cursorCenterY + Math.sin(particleAngle) * emissionDistance - 2;

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

                    // Position relative to cursor element center
                    const x = cursorCenterX + Math.cos(particleAngle) * emissionDistance - 2;
                    const y = cursorCenterY + Math.sin(particleAngle) * emissionDistance - 2;

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

    prepareDirectionalRemoval(movementAngle) {
        // Remove dots starting from the direction of movement, going clockwise
        const activeParticles = this.idleParticles.filter(p => p.active);

        if (activeParticles.length === 0) return;

        // Calculate angle for each particle from cursor center
        const cursorCenterX = 45;
        const cursorCenterY = 45;

        const particlesWithAngles = activeParticles.map(particle => {
            // Calculate particle angle relative to cursor center
            const dx = particle.x + 2 - cursorCenterX; // +2 to account for particle center
            const dy = particle.y + 2 - cursorCenterY;
            let particleAngle = Math.atan2(dy, dx);

            // Calculate angular distance from movement direction (going clockwise)
            let angleDiff = particleAngle - movementAngle;

            // Normalize to [0, 2π] range to ensure clockwise ordering
            if (angleDiff < 0) angleDiff += Math.PI * 2;

            return { particle, angleDiff };
        });

        // Sort by angular distance (clockwise from movement direction)
        particlesWithAngles.sort((a, b) => a.angleDiff - b.angleDiff);

        // Set removal queue in order
        this.idleDotsToRemove = particlesWithAngles.map(p => p.particle);
    }

    detachIdleParticles() {
        // Convert idle particles from cursor-relative to fixed-position
        // so they stay in place when cursor moves away
        // Remove them sequentially from first to last (following animation flow)
        const activeParticles = this.idleParticles.filter(p => p.active);

        activeParticles.forEach((particle, index) => {
            // Calculate current screen position
            const rect = particle.element.getBoundingClientRect();
            const screenX = rect.left;
            const screenY = rect.top;

            // Remove from cursor element
            particle.element.remove();

            // Create a new fixed particle at the same screen position
            const fixedParticle = document.createElement('div');
            fixedParticle.className = 'cursor-particle idle-detached';
            fixedParticle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: rgb(255, 255, 255);
                border-radius: 50%;
                pointer-events: none;
                left: ${screenX}px;
                top: ${screenY}px;
                opacity: ${particle.element.style.opacity};
                transition: opacity 0.3s ease;
            `;

            // Add to trail container (has same mix-blend-mode as cursor)
            this.trailContainer.appendChild(fixedParticle);

            // Sequential fade out - each dot fades after the previous one
            const sequentialDelay = index * 40; // 40ms between each dot
            setTimeout(() => {
                fixedParticle.style.opacity = '0';
                setTimeout(() => {
                    fixedParticle.remove();
                }, 300);
            }, 200 + sequentialDelay); // Start fading after 200ms + sequential delay

            // Mark particle as inactive
            particle.active = false;
            particle.element.style.opacity = '0';
        });

        // Recreate idle particles for future use
        this.idleParticles.forEach((particle) => {
            const newParticle = document.createElement('div');
            newParticle.className = 'cursor-particle idle';
            newParticle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgb(255, 255, 255);
                border-radius: 50%;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                z-index: -1;
            `;
            this.cursor.appendChild(newParticle);
            particle.element = newParticle;
            particle.active = false;
        });
    }

    spawnTrailDot() {
        // Create a new trail dot - added to trail container which has same blend mode as cursor
        // Trail dots stay at their spawn position (don't move with cursor)
        const trailDot = document.createElement('div');
        trailDot.className = 'cursor-particle trail';
        trailDot.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: rgb(255, 255, 255);
            border-radius: 50%;
            pointer-events: none;
            left: ${this.cursorX - 2}px;
            top: ${this.cursorY - 2}px;
            opacity: 0.6;
            transition: opacity 0.3s ease;
        `;
        // Add to trail container (has same mix-blend-mode: difference as cursor)
        this.trailContainer.appendChild(trailDot);

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

    checkBannerOverContent(x, y) {
        // Banner appearance is now controlled by hover state on magnetic elements
        // This method is kept for potential future use but no longer switches banner styles
        // The banner style switching is handled in mouseenter/mouseleave events
    }


    createClickRipple() {
        // Cursor center is at 45px, 45px (half of 90x90)
        const cursorCenterX = 45;
        const cursorCenterY = 45;

        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            left: ${cursorCenterX}px;
            top: ${cursorCenterY}px;
            width: 0;
            height: 0;
            border: 2px solid rgb(255, 255, 255);
            border-radius: 50%;
            pointer-events: none;
            transform: translate(-50%, -50%);
            animation: rippleEffect 0.6s ease-out forwards;
            z-index: -1;
        `;

        // Add to cursor element (inherits mix-blend-mode from cursor)
        this.cursor.appendChild(ripple);

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

        // Spawn trail dots based on distance traveled (ensures consistent spacing)
        if (!this.isIdle && this.mouseSpeed > 0.5) {
            const dx = this.cursorX - this.lastTrailX;
            const dy = this.cursorY - this.lastTrailY;
            const distanceTraveled = Math.sqrt(dx * dx + dy * dy);

            // Spawn a new dot when cursor has moved the spawn distance
            if (distanceTraveled >= this.trailSpawnDistance) {
                this.spawnTrailDot();
                this.lastTrailX = this.cursorX;
                this.lastTrailY = this.cursorY;
            }
        }

        // Update banner rotation smoothly without snapping
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Smoothly interpolate rotation speed towards target
        const speedLerpFactor = 0.05;
        this.bannerRotationSpeed += (this.targetRotationSpeed - this.bannerRotationSpeed) * speedLerpFactor;

        // Update rotation angle
        this.bannerRotation += this.bannerRotationSpeed * deltaTime;
        this.bannerRotation = this.bannerRotation % 360; // Keep within 0-360

        // Apply rotation to SVG
        if (this.cursorSVG) {
            this.cursorSVG.style.transform = `rotate(${this.bannerRotation}deg)`;
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
