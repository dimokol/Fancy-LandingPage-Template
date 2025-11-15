// Text Scramble Effect with Japanese Characters
// Creates a matrix-like reveal effect with optional Japanese translation

export class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
        this.update = this.update.bind(this);
    }

    setText(newText, japaneseText = null) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);

        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }

        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;

        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];

            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="scramble-char">${char}</span>`;
            } else {
                output += from;
            }
        }

        this.el.innerHTML = output;

        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }

    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// Text Scramble Manager - handles multiple elements
export class TextScrambleManager {
    constructor() {
        this.scramblers = new Map();
        this.observer = null;

        // Japanese translations dictionary (extend this as needed)
        this.translations = {
            'Enter The Void': '虚空に入る',
            'Ethereal': '幽玄',
            'Features': '特徴',
            'Experience': '体験',
            'Contact': '連絡',
            'Explore': '探索',
            'Discover': '発見',
            'Create': '創造',
            'Transform': '変革',
            'Immersive': '没入型',
            'Abstract': '抽象的',
            'Powerful': '強力な'
        };
    }

    init() {
        // Find all elements with scramble class
        const elements = document.querySelectorAll('[data-scramble]');

        elements.forEach(el => {
            const scrambler = new TextScramble(el);
            this.scramblers.set(el, scrambler);

            // Get original text and Japanese translation
            const originalText = el.textContent;
            const japaneseText = el.dataset.scrambleJa || this.translations[originalText] || null;

            // Store original text
            el.dataset.originalText = originalText;
            if (japaneseText) {
                el.dataset.japaneseText = japaneseText;
            }
        });

        // Set up intersection observer for reveal on scroll
        this.setupScrollReveal();

        // Set up hover effects
        this.setupHoverEffects();
    }

    setupScrollReveal() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const scrambler = this.scramblers.get(entry.target);
                const originalText = entry.target.dataset.originalText;

                if (entry.isIntersecting) {
                    // Trigger scramble every time element comes into view
                    if (scrambler && originalText) {
                        // Clear current text to create anticipation
                        entry.target.textContent = '';

                        setTimeout(() => {
                            scrambler.setText(originalText);
                        }, 150);
                    }
                } else {
                    // Optional: Reset text when out of view (for repeating effect)
                    if (scrambler && originalText) {
                        entry.target.textContent = '';
                    }
                }
            });
        }, {
            threshold: 0.3,  // Trigger earlier for better UX
            rootMargin: '0px 0px -100px 0px'  // Trigger before element is fully in view
        });

        this.scramblers.forEach((scrambler, el) => {
            this.observer.observe(el);
        });
    }

    setupHoverEffects() {
        this.scramblers.forEach((scrambler, el) => {
            // Skip if element doesn't have hover scramble enabled
            if (!el.dataset.scrambleHover) return;

            const originalText = el.dataset.originalText;
            const japaneseText = el.dataset.japaneseText;

            let isHovered = false;

            el.addEventListener('mouseenter', () => {
                if (japaneseText && !isHovered) {
                    isHovered = true;
                    scrambler.setText(japaneseText).then(() => {
                        // Show Japanese for a moment
                        setTimeout(() => {
                            if (!isHovered) {
                                scrambler.setText(originalText);
                            }
                        }, 1500);
                    });
                }
            });

            el.addEventListener('mouseleave', () => {
                isHovered = false;
                if (japaneseText) {
                    setTimeout(() => {
                        if (!isHovered) {
                            scrambler.setText(originalText);
                        }
                    }, 300);
                }
            });
        });
    }

    // Manually trigger scramble on an element
    scrambleElement(el, text) {
        const scrambler = this.scramblers.get(el);
        if (scrambler) {
            return scrambler.setText(text);
        }
    }
}

// Add CSS for scramble characters
if (!document.querySelector('#scramble-styles')) {
    const style = document.createElement('style');
    style.id = 'scramble-styles';
    style.textContent = `
        .scramble-char {
            color: var(--vibrant-orange);
            opacity: 0.8;
        }

        [data-scramble] {
            font-feature-settings: 'kern';
            letter-spacing: inherit;
        }
    `;
    document.head.appendChild(style);
}
