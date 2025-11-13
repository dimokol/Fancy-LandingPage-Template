// Main Application Entry Point
// Ethereal Void Landing Page

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomCursor } from './modules/cursor.js';
import { ScrollAnimations } from './modules/scrollAnimations.js';
import { ThreeScene } from './modules/threeScene.js';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

class EtherealVoid {
    constructor() {
        this.cursor = null;
        this.scrollAnimations = null;
        this.threeScene = null;
        this.lenis = null;

        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        console.log('🌌 Ethereal Void - Initializing...');

        // Initialize smooth scrolling with Lenis
        this.initSmoothScroll();

        // Initialize custom cursor
        this.cursor = new CustomCursor();

        // Initialize scroll animations
        this.scrollAnimations = new ScrollAnimations();
        this.scrollAnimations.initCounters();

        // Initialize Three.js scene
        const canvas = document.getElementById('webgl-canvas');
        this.threeScene = new ThreeScene(canvas, this.cursor);

        // Connect scroll to Three.js
        this.scrollAnimations.onScrollProgress((progress) => {
            this.threeScene.updateOnScroll(progress);
        });

        // Initialize GSAP animations
        this.initGSAPAnimations();

        // Initialize form interactions
        this.initFormInteractions();

        // Initialize gallery effects
        this.initGalleryEffects();

        // Initialize tilt effects
        this.initTiltEffects();

        console.log('✨ Ethereal Void - Ready');
    }

    initSmoothScroll() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        // Sync Lenis with GSAP
        this.lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            this.lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);

        // Anchor link smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    this.lenis.scrollTo(target, { offset: -100 });
                }
            });
        });
    }

    initGSAPAnimations() {
        // Hero text animation with stagger
        gsap.from('.hero-title .word', {
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top center',
            },
            y: 100,
            opacity: 0,
            rotationX: -90,
            stagger: 0.2,
            duration: 1,
            ease: 'power3.out'
        });

        // Feature cards scroll animation
        gsap.from('.feature-card', {
            scrollTrigger: {
                trigger: '.features-section',
                start: 'top 80%',
            },
            y: 80,
            opacity: 0,
            stagger: 0.15,
            duration: 1,
            ease: 'power3.out'
        });

        // Section titles animation
        gsap.utils.toArray('.section-title').forEach(title => {
            const lines = title.querySelectorAll('.title-line');

            gsap.from(lines, {
                scrollTrigger: {
                    trigger: title,
                    start: 'top 80%',
                },
                y: 100,
                opacity: 0,
                stagger: 0.1,
                duration: 1,
                ease: 'power3.out'
            });
        });

        // Experience section parallax
        gsap.to('.experience-visual', {
            scrollTrigger: {
                trigger: '.experience-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            },
            y: -100,
            ease: 'none'
        });

        // Gallery items stagger
        gsap.from('.gallery-item', {
            scrollTrigger: {
                trigger: '.gallery-section',
                start: 'top 80%',
            },
            scale: 0.8,
            opacity: 0,
            stagger: 0.2,
            duration: 1,
            ease: 'back.out(1.7)'
        });

        // Contact form animation
        gsap.from('.form-group', {
            scrollTrigger: {
                trigger: '.contact-form',
                start: 'top 80%',
            },
            x: -50,
            opacity: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: 'power2.out'
        });

        // Button hover animations
        document.querySelectorAll('.cta-button').forEach(button => {
            button.addEventListener('mouseenter', () => {
                gsap.to(button, {
                    scale: 1.05,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            button.addEventListener('mouseleave', () => {
                gsap.to(button, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });

        // Nav links hover effect
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('mouseenter', () => {
                gsap.to(link, {
                    x: 5,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            link.addEventListener('mouseleave', () => {
                gsap.to(link, {
                    x: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
        });
    }

    initFormInteractions() {
        const form = document.querySelector('.contact-form');
        const inputs = form.querySelectorAll('.form-input');

        // Input focus animations
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                gsap.to(input.nextElementSibling, {
                    scaleX: 1,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });

            input.addEventListener('blur', () => {
                if (!input.value) {
                    gsap.to(input.nextElementSibling, {
                        scaleX: 0,
                        duration: 0.5,
                        ease: 'power2.out'
                    });
                }
            });
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const button = form.querySelector('.cta-button');
            const originalText = button.querySelector('.button-text').textContent;

            // Animate button
            gsap.to(button, {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    button.querySelector('.button-text').textContent = 'Sent! ✓';

                    gsap.to(button, {
                        backgroundColor: '#00d4ff',
                        duration: 0.3
                    });

                    setTimeout(() => {
                        button.querySelector('.button-text').textContent = originalText;
                        form.reset();
                    }, 2000);
                }
            });
        });
    }

    initGalleryEffects() {
        const galleryItems = document.querySelectorAll('.gallery-item');

        galleryItems.forEach((item, index) => {
            const wrapper = item.querySelector('.gallery-image-wrapper');

            // Create a gradient background
            const colors = [
                'linear-gradient(135deg, #8b5cf6, #00d4ff)',
                'linear-gradient(135deg, #ff006e, #d946ff)',
                'linear-gradient(135deg, #00d4ff, #1a0633)'
            ];

            wrapper.style.background = colors[index % colors.length];

            // Hover effect
            item.addEventListener('mouseenter', () => {
                gsap.to(wrapper, {
                    scale: 1.15,
                    duration: 0.6,
                    ease: 'power2.out'
                });

                gsap.to(item.querySelector('.gallery-label'), {
                    y: -10,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            item.addEventListener('mouseleave', () => {
                gsap.to(wrapper, {
                    scale: 1,
                    duration: 0.6,
                    ease: 'power2.out'
                });

                gsap.to(item.querySelector('.gallery-label'), {
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            // Click animation
            item.addEventListener('click', () => {
                gsap.to(item, {
                    scale: 0.95,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1
                });
            });
        });
    }

    initTiltEffects() {
        const tiltElements = document.querySelectorAll('[data-tilt]');

        tiltElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;

                gsap.to(element, {
                    rotationX: rotateX,
                    rotationY: rotateY,
                    duration: 0.5,
                    ease: 'power2.out',
                    transformPerspective: 1000
                });
            });

            element.addEventListener('mouseleave', () => {
                gsap.to(element, {
                    rotationX: 0,
                    rotationY: 0,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });
        });
    }
}

// Initialize the application
const app = new EtherealVoid();

// Export for debugging
window.etherealVoid = app;
