// Scroll-based animations and interactions
// Handles reveal animations, parallax, and scroll progress

export class ScrollAnimations {
    constructor() {
        this.progressBar = document.querySelector('.progress-fill');
        this.sections = document.querySelectorAll('.section');
        this.titleLines = document.querySelectorAll('.title-line');
        this.fadeElements = document.querySelectorAll('.fade-in');
        this.featureCards = document.querySelectorAll('.feature-card');

        this.scrollCallbacks = [];

        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.onScroll());
        this.onScroll(); // Initial check
    }

    onScroll() {
        this.updateProgressBar();
        this.revealElements();
        this.animateOnScroll();

        // Trigger callbacks for other modules
        const scrollProgress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        this.scrollCallbacks.forEach(callback => callback(scrollProgress));
    }

    updateProgressBar() {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        this.progressBar.style.width = `${scrollPercent}%`;
    }

    revealElements() {
        // Reveal title lines
        this.titleLines.forEach(line => {
            if (this.isInViewport(line)) {
                line.classList.add('visible');
            }
        });

        // Reveal fade-in elements
        this.fadeElements.forEach(el => {
            if (this.isInViewport(el)) {
                el.classList.add('visible');
            }
        });
    }

    animateOnScroll() {
        // Parallax and 3D transformations based on scroll
        this.featureCards.forEach((card, index) => {
            if (this.isInViewport(card)) {
                const rect = card.getBoundingClientRect();
                const scrollProgress = (window.innerHeight - rect.top) / window.innerHeight;

                // Stagger animation
                const delay = index * 0.1;
                const progress = Math.max(0, Math.min(1, scrollProgress - delay));

                card.style.opacity = progress;
                card.style.transform = `translateY(${(1 - progress) * 50}px)`;
            }
        });
    }

    isInViewport(element, offset = 100) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight - offset) &&
            rect.bottom >= offset
        );
    }

    onScrollProgress(callback) {
        this.scrollCallbacks.push(callback);
    }

    // Counter animation for stats
    animateCounter(element, target, duration = 2000) {
        const start = 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (target - start) * easeOutQuart);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target;
            }
        };

        requestAnimationFrame(animate);
    }

    initCounters() {
        const statNumbers = document.querySelectorAll('.stat-number');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    const target = parseInt(entry.target.dataset.count);
                    this.animateCounter(entry.target, target);
                    entry.target.classList.add('counted');
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => observer.observe(stat));
    }
}
