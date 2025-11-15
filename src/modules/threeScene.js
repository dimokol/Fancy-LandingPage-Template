// Main Three.js Scene Manager - Updated with Model Support
// Eerie, minimal aesthetic with orange accents

import * as THREE from 'three';
import { ModelLoader, createPlaceholderModel } from './modelLoader.js';

export class ThreeScene {
    constructor(canvas, cursor) {
        this.canvas = canvas;
        this.cursor = cursor;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0d0d0d, 10, 50);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 0, 8);

        // Smooth camera targets (FIX FOR SNAP-BACK BUG)
        this.cameraTarget = {
            x: 0,
            y: 0,
            z: 8
        };

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;

        // Time and mouse
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();

        // Model loader
        this.modelLoader = new ModelLoader(this.scene, this.cursor);

        // 3D Objects storage
        this.objects = {
            mainModel: null,
            floatingInstances: [],
            eerieParticles: null,
            ambientLines: []
        };

        // Scroll tracking
        this.scrollProgress = 0;
        this.targetScrollProgress = 0;

        this.init();
    }

    async init() {
        this.createLighting();
        await this.createMainModel();
        this.createEerieParticles();
        this.createAmbientLines();

        this.setupEventListeners();
        this.animate();
    }

    createLighting() {
        // Ambient light - dim
        const ambientLight = new THREE.AmbientLight(0xf5f5f0, 0.3);
        this.scene.add(ambientLight);

        // Key light with orange tint
        const keyLight = new THREE.DirectionalLight(0xff6b35, 1.5);
        keyLight.position.set(5, 5, 5);
        keyLight.castShadow = true;
        this.scene.add(keyLight);

        // Fill light - cool white
        const fillLight = new THREE.DirectionalLight(0xf5f5f0, 0.8);
        fillLight.position.set(-5, 0, 5);
        this.scene.add(fillLight);

        // Rim light - orange
        const rimLight = new THREE.PointLight(0xff6b35, 2, 20);
        rimLight.position.set(0, 5, -5);
        this.scene.add(rimLight);
    }

    async createMainModel() {
        try {
            // Try to load the lion totem model
            const model = await this.modelLoader.loadModel('/models/lion_totem.glb', {
                name: 'lionTotem',
                scale: 2.0,
                position: [0, 0, 0],
                color: 0xf5f5f0
            });

            this.objects.mainModel = model;

            // Try to load additional shapes for floating instances
            const shapes = [];
            for (let i = 1; i <= 4; i++) {
                try {
                    const shape = await this.modelLoader.loadModel(`/models/shape_0${i}.glb`, {
                        name: `shape${i}`,
                        scale: 0.5
                    });
                    shapes.push(shape);
                } catch (e) {
                    // Use placeholder if model not found
                    const types = ['cube', 'sphere', 'torus', 'octahedron'];
                    const placeholder = createPlaceholderModel(types[i - 1]);
                    this.scene.add(placeholder);
                    shapes.push(placeholder);
                }
            }

            // Create floating instances
            if (shapes.length > 0) {
                this.objects.floatingInstances = this.modelLoader.createFloatingInstances(
                    shapes[0],
                    8,
                    6
                );
            }

        } catch (error) {
            console.log('Using placeholder models');

            // Create placeholder lion
            const lionPlaceholder = createPlaceholderModel('lion', 0xf5f5f0);
            lionPlaceholder.scale.set(2, 2, 2);
            this.scene.add(lionPlaceholder);
            this.objects.mainModel = lionPlaceholder;

            // Create placeholder shapes for floating instances
            const shapes = ['cube', 'sphere', 'torus', 'octahedron'];
            const instances = [];

            shapes.forEach((type, i) => {
                const shape = createPlaceholderModel(type);
                const count = 2;

                for (let j = 0; j < count; j++) {
                    const instance = shape.clone();

                    // Position in orbit
                    const angle = ((i * count + j) / (shapes.length * count)) * Math.PI * 2;
                    const radius = 5 + Math.random() * 2;

                    instance.position.set(
                        Math.cos(angle) * radius,
                        (Math.random() - 0.5) * 4,
                        Math.sin(angle) * radius
                    );

                    const scale = 0.3 + Math.random() * 0.2;
                    instance.scale.set(scale, scale, scale);

                    instances.push({
                        mesh: instance,
                        originalPosition: instance.position.clone(),
                        originalRotation: instance.rotation.clone(),
                        rotationSpeed: {
                            x: (Math.random() - 0.5) * 0.02,
                            y: (Math.random() - 0.5) * 0.02,
                            z: (Math.random() - 0.5) * 0.02
                        },
                        floatOffset: Math.random() * Math.PI * 2,
                        flipSpeed: 0,
                        flipAxis: new THREE.Vector3(0, 1, 0)
                    });

                    this.scene.add(instance);
                }
            });

            this.objects.floatingInstances = instances;
        }
    }

    createEerieParticles() {
        // Create abstract, minimal particle system
        const count = 150;  // Fewer particles for minimal look
        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        const randomness = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Spread in a larger volume for eerie effect
            const radius = 8 + Math.random() * 12;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            scales[i] = Math.random() * 0.5 + 0.5;

            randomness[i3] = Math.random();
            randomness[i3 + 1] = Math.random();
            randomness[i3 + 2] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
        geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));

        // Simple point material - orange
        const material = new THREE.PointsMaterial({
            size: 0.08,
            color: 0xff6b35,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.objects.eerieParticles = particles;
    }

    createAmbientLines() {
        // Create abstract line geometries for eerie atmosphere
        for (let i = 0; i < 15; i++) {
            const points = [];
            const segmentCount = 20;

            for (let j = 0; j < segmentCount; j++) {
                const t = j / (segmentCount - 1);
                const angle = t * Math.PI * 4 + i;
                const radius = 3 + i * 0.3;

                points.push(new THREE.Vector3(
                    Math.cos(angle) * radius,
                    (t - 0.5) * 10,
                    Math.sin(angle) * radius
                ));
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: 0xff6b35,
                transparent: true,
                opacity: 0.05 + Math.random() * 0.1
            });

            const line = new THREE.Line(geometry, material);
            line.userData.rotationSpeed = (Math.random() - 0.5) * 0.001;
            this.scene.add(line);

            this.objects.ambientLines.push(line);
        }
    }

    setupEventListeners() {
        // Mouse movement
        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }

    // FIXED: Smooth camera updates instead of direct position setting
    updateOnScroll(scrollProgress) {
        // Update target instead of directly setting position
        this.targetScrollProgress = scrollProgress;

        // Update model loader scroll speed for animations
        this.modelLoader.updateScrollSpeed(window.scrollY);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsedTime = this.clock.getElapsedTime();
        const deltaTime = this.clock.getDelta();

        // Smooth mouse lerp
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        // Smooth scroll lerp (FIX FOR SNAP-BACK BUG)
        this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;

        // Smooth camera movement based on scroll
        this.cameraTarget.y = -this.scrollProgress * 8;
        this.cameraTarget.x = this.mouse.x * 0.5;

        // Apply camera movement smoothly
        this.camera.position.x += (this.cameraTarget.x - this.camera.position.x) * 0.05;
        this.camera.position.y += (this.cameraTarget.y - this.camera.position.y) * 0.05;

        // Subtle camera rotation based on mouse
        this.camera.rotation.y = this.mouse.x * 0.05;
        this.camera.rotation.x = -this.mouse.y * 0.03;

        // Animate main model
        if (this.objects.mainModel) {
            // Slow rotation
            this.objects.mainModel.rotation.y += 0.002;

            // Subtle floating
            this.objects.mainModel.position.y = Math.sin(elapsedTime * 0.3) * 0.3;

            // Respond to mouse
            this.objects.mainModel.rotation.x = this.mouse.y * 0.1;

            // Scale based on scroll (zoom effect)
            const scrollScale = 1 + this.scrollProgress * 0.3;
            this.objects.mainModel.scale.setScalar(2.0 * scrollScale);
        }

        // Animate floating instances
        if (this.objects.floatingInstances.length > 0) {
            this.modelLoader.updateFloatingInstances(
                this.objects.floatingInstances,
                elapsedTime,
                this.scrollProgress
            );
        }

        // Animate eerie particles
        if (this.objects.eerieParticles) {
            this.objects.eerieParticles.rotation.y = elapsedTime * 0.02;

            // Subtle pulsing
            const pulse = Math.sin(elapsedTime) * 0.2 + 0.8;
            this.objects.eerieParticles.material.opacity = 0.3 * pulse;
        }

        // Animate ambient lines
        this.objects.ambientLines.forEach(line => {
            line.rotation.y += line.userData.rotationSpeed;
        });

        // Update model animations
        this.modelLoader.update(deltaTime);

        this.renderer.render(this.scene, this.camera);
    }
}
