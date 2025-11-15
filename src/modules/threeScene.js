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
        this.scene.fog = new THREE.Fog(0xfaf9f6, 15, 60);  // Ghost white fog

        this.camera = new THREE.PerspectiveCamera(
            55,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 2, 12);

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
        this.scrollVelocity = 0;
        this.scrollDirection = 1;
        this.lastScrollY = 0;

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
        // Ambient light - bright for white background
        const ambientLight = new THREE.AmbientLight(0xfaf9f6, 0.6);
        this.scene.add(ambientLight);

        // Key light - soft white with slight warmth
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(5, 8, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        this.scene.add(keyLight);

        // Fill light - softer white
        const fillLight = new THREE.DirectionalLight(0xf5f5f0, 0.6);
        fillLight.position.set(-5, 2, 5);
        this.scene.add(fillLight);

        // Rim light - strategic orange accent
        const rimLight = new THREE.PointLight(0xff6b35, 1.5, 25);
        rimLight.position.set(0, 6, -8);
        this.scene.add(rimLight);

        // Back light for depth
        const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
        backLight.position.set(0, -5, -5);
        this.scene.add(backLight);
    }

    async createMainModel() {
        try {
            // Load the lion totem model as the main centerpiece
            const lionModel = await this.modelLoader.loadModel('/models/lion_totem.glb', {
                name: 'lionTotem',
                scale: 3.0,
                position: [0, 0, 0],
                color: 0xf5f5f0  // Keep white reflective material
            });

            this.objects.mainModel = lionModel;
            console.log('✓ Lion totem loaded successfully');

            // Load all other GLB models to scatter around the lion
            const modelFiles = [
                'hyperbolic-cuboctahedron.glb',
                'inverse-menger-sponge.glb',
                'hyperbolic-inverse-menger-multihedron.glb',
                'hyperbolic-trucated-inverse-menger-multihedron-fractal.glb',
                'hyperbolic-multihedron.glb',
                'hyperbolic-octahedron.glb',
                'truncated-octahedron-fractal.glb'
            ];

            const loadedShapes = [];

            for (const filename of modelFiles) {
                try {
                    const shape = await this.modelLoader.loadModel(`/models/${filename}`, {
                        name: filename.replace('.glb', ''),
                        scale: 0.8,
                        color: 0xf5f5f0  // White reflective material
                    });
                    loadedShapes.push(shape);
                    console.log(`✓ Loaded ${filename}`);
                } catch (e) {
                    console.log(`✗ Could not load ${filename}, using placeholder`);
                    const placeholder = createPlaceholderModel('octahedron', 0xf5f5f0);
                    this.scene.add(placeholder);
                    loadedShapes.push(placeholder);
                }
            }

            // Create small floating instances around the lion
            const instances = [];
            const orbitRadius = 7;
            const verticalSpread = 5;

            loadedShapes.forEach((shape, index) => {
                // Create 1-2 instances of each shape
                const instanceCount = 1 + Math.floor(Math.random() * 2);

                for (let i = 0; i < instanceCount; i++) {
                    const clone = shape.clone();

                    // Distribute in a sphere around the lion
                    const angle = ((index * instanceCount + i) / (loadedShapes.length * 1.5)) * Math.PI * 2;
                    const heightAngle = (Math.random() - 0.5) * Math.PI * 0.6;
                    const radius = orbitRadius + (Math.random() - 0.5) * 3;

                    clone.position.set(
                        Math.cos(angle) * Math.cos(heightAngle) * radius,
                        Math.sin(heightAngle) * verticalSpread,
                        Math.sin(angle) * Math.cos(heightAngle) * radius
                    );

                    // Randomize scale (small around the lion)
                    const scale = 0.15 + Math.random() * 0.25;
                    clone.scale.set(scale, scale, scale);

                    // Random initial rotation
                    clone.rotation.set(
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2
                    );

                    // Store animation data with scroll direction tracking
                    instances.push({
                        mesh: clone,
                        originalPosition: clone.position.clone(),
                        originalRotation: clone.rotation.clone(),
                        baseRotationSpeed: {
                            x: (Math.random() - 0.5) * 0.005,
                            y: (Math.random() - 0.5) * 0.005,
                            z: (Math.random() - 0.5) * 0.005
                        },
                        rotationSpeed: {
                            x: 0,
                            y: 0,
                            z: 0
                        },
                        floatOffset: Math.random() * Math.PI * 2,
                        scrollDirection: 1
                    });

                    this.scene.add(clone);
                }
            });

            this.objects.floatingInstances = instances;
            console.log(`✓ Created ${instances.length} floating instances`);

        } catch (error) {
            console.log('Error loading models, using placeholders:', error);

            // Fallback: Create placeholder lion
            const lionPlaceholder = createPlaceholderModel('lion', 0xf5f5f0);
            lionPlaceholder.scale.set(3, 3, 3);
            this.scene.add(lionPlaceholder);
            this.objects.mainModel = lionPlaceholder;

            // Create placeholder shapes
            const instances = [];
            const shapes = ['cube', 'sphere', 'torus', 'octahedron', 'cube', 'sphere'];

            shapes.forEach((type, i) => {
                const shape = createPlaceholderModel(type, 0xf5f5f0);
                const angle = (i / shapes.length) * Math.PI * 2;
                const radius = 7;

                shape.position.set(
                    Math.cos(angle) * radius,
                    (Math.random() - 0.5) * 5,
                    Math.sin(angle) * radius
                );

                const scale = 0.2 + Math.random() * 0.2;
                shape.scale.set(scale, scale, scale);

                instances.push({
                    mesh: shape,
                    originalPosition: shape.position.clone(),
                    originalRotation: shape.rotation.clone(),
                    baseRotationSpeed: {
                        x: (Math.random() - 0.5) * 0.005,
                        y: (Math.random() - 0.005) * 0.005,
                        z: (Math.random() - 0.5) * 0.005
                    },
                    rotationSpeed: { x: 0, y: 0, z: 0 },
                    floatOffset: Math.random() * Math.PI * 2,
                    scrollDirection: 1
                });

                this.scene.add(shape);
            });

            this.objects.floatingInstances = instances;
        }
    }

    createEerieParticles() {
        // Create minimal, round particle system
        const count = 120;  // Fewer particles for performance and minimalism
        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        const randomness = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Spread in a larger volume
            const radius = 10 + Math.random() * 15;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            scales[i] = Math.random() * 0.8 + 0.4;

            randomness[i3] = Math.random();
            randomness[i3 + 1] = Math.random();
            randomness[i3 + 2] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
        geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));

        // Round particle material with canvas texture for perfect circles
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // Draw perfect circle
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 107, 53, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 107, 53, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 107, 53, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);

        const material = new THREE.PointsMaterial({
            size: 0.15,
            map: texture,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
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

    // Smooth camera updates with scroll tracking
    updateOnScroll(scrollProgress) {
        this.targetScrollProgress = scrollProgress;

        // Track scroll speed and direction
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - this.lastScrollY;
        this.scrollVelocity = scrollDelta;
        this.lastScrollY = currentScrollY;

        // Update scroll direction for instances
        if (Math.abs(scrollDelta) > 0.5) {
            this.scrollDirection = scrollDelta > 0 ? 1 : -1;  // 1 for down, -1 for up
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsedTime = this.clock.getElapsedTime();
        const deltaTime = this.clock.getDelta();

        // Smooth mouse lerp
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        // Smooth scroll lerp
        this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;

        // Smooth scroll velocity decay
        this.scrollVelocity *= 0.95;

        // IMPROVED CAMERA POSITIONING - Keep models in view at all scroll positions
        // Calculate camera position to maintain view of models
        const baseY = 2;
        const scrollOffset = this.scrollProgress * 15;  // Move camera down as we scroll

        // Calculate target camera position
        this.cameraTarget.y = baseY - scrollOffset * 0.5;
        this.cameraTarget.z = 12 - scrollOffset * 0.3;  // Move camera slightly closer as we scroll
        this.cameraTarget.x = this.mouse.x * 0.8;

        // Apply camera movement smoothly
        this.camera.position.x += (this.cameraTarget.x - this.camera.position.x) * 0.05;
        this.camera.position.y += (this.cameraTarget.y - this.camera.position.y) * 0.05;
        this.camera.position.z += (this.cameraTarget.z - this.camera.position.z) * 0.05;

        // Camera looks at a point that moves with scroll
        const lookAtY = -scrollOffset * 0.7;
        this.camera.lookAt(0, lookAtY, 0);

        // Subtle camera rotation based on mouse (minimal)
        this.camera.rotation.z = this.mouse.x * 0.02;

        // ANIMATE MAIN LION MODEL - Stationary with subtle parallax
        if (this.objects.mainModel) {
            // Subtle parallax tied to mouse (not rotation)
            this.objects.mainModel.position.x = this.mouse.x * 0.5;
            this.objects.mainModel.position.z = this.mouse.y * 0.3;

            // Very subtle floating
            this.objects.mainModel.position.y = Math.sin(elapsedTime * 0.3) * 0.2;

            // Minimal rotation for visual interest
            this.objects.mainModel.rotation.y = Math.sin(elapsedTime * 0.1) * 0.05;
            this.objects.mainModel.rotation.x = Math.cos(elapsedTime * 0.15) * 0.03;
        }

        // ANIMATE FLOATING INSTANCES - Scroll-based rotation
        if (this.objects.floatingInstances.length > 0) {
            this.objects.floatingInstances.forEach((instance, index) => {
                const mesh = instance.mesh;

                // Calculate scroll-influenced rotation speed
                const scrollInfluence = Math.abs(this.scrollVelocity) * 0.05;
                const rotationMultiplier = 1 + scrollInfluence;

                // Set rotation direction based on scroll direction
                const direction = this.scrollDirection;

                // Update rotation speed with scroll influence
                instance.rotationSpeed.x = instance.baseRotationSpeed.x * rotationMultiplier * direction;
                instance.rotationSpeed.y = instance.baseRotationSpeed.y * rotationMultiplier * direction;
                instance.rotationSpeed.z = instance.baseRotationSpeed.z * rotationMultiplier * direction;

                // Apply rotation (chill and smooth)
                mesh.rotation.x += instance.rotationSpeed.x * 0.3;
                mesh.rotation.y += instance.rotationSpeed.y * 0.3;
                mesh.rotation.z += instance.rotationSpeed.z * 0.3;

                // Subtle floating motion
                const floatY = Math.sin(elapsedTime * 0.4 + instance.floatOffset) * 0.3;
                mesh.position.y = instance.originalPosition.y + floatY;

                // Gentle orbital drift
                const driftAngle = elapsedTime * 0.05 + (index / this.objects.floatingInstances.length) * Math.PI * 2;
                const driftAmount = 0.3;
                mesh.position.x = instance.originalPosition.x + Math.cos(driftAngle) * driftAmount;
                mesh.position.z = instance.originalPosition.z + Math.sin(driftAngle) * driftAmount;
            });
        }

        // Animate particles - very subtle
        if (this.objects.eerieParticles) {
            this.objects.eerieParticles.rotation.y = elapsedTime * 0.015;

            // Subtle pulsing
            const pulse = Math.sin(elapsedTime * 0.5) * 0.1 + 0.9;
            this.objects.eerieParticles.material.opacity = 0.25 * pulse;
        }

        // Animate ambient lines - very slow
        this.objects.ambientLines.forEach(line => {
            line.rotation.y += line.userData.rotationSpeed;
        });

        // Update model animations
        this.modelLoader.update(deltaTime);

        this.renderer.render(this.scene, this.camera);
    }
}
