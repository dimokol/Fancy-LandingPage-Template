// Custom Magnetic Cursor with Fluid Trail
// Interactive cursor that responds to hover and creates visual effects

export class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.cursorInner = document.querySelector('.cursor-inner');
        this.cursorTrail = document.querySelector('.cursor-trail');

        this.mouseX = 0;
        this.mouseY = 0;
        this.cursorX = 0;
        this.cursorY = 0;
        this.trailX = 0;
        this.trailY = 0;

        this.hoveredElement = null;

        this.init();
    }

    init() {
        // Track mouse position
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        // Detect hover on interactive elements
        const interactiveElements = document.querySelectorAll(
            'a, button, .feature-card, .gallery-item, .nav-link, .form-input'
        );

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('hover');
                this.hoveredElement = el;
            });

            el.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('hover');
                this.hoveredElement = null;
            });
        });

        // Start animation loop
        this.animate();
    }

    animate() {
        // Smooth cursor follow with easing
        const ease = 0.15;
        this.cursorX += (this.mouseX - this.cursorX) * ease;
        this.cursorY += (this.mouseY - this.cursorY) * ease;

        // Trail follows with more lag
        const trailEase = 0.08;
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

            if (distance < 100) {
                const pull = (100 - distance) / 100 * 0.3;
                this.cursorX += deltaX * pull;
                this.cursorY += deltaY * pull;
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
}
