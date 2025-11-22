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
        this.isScrolling = false;
        this.scrollTimeout = null;

        // Wheel scroll tracking (for additional scroll beyond page limits)
        this.wheelDelta = 0;
        this.wheelVelocity = 0;
        this.lastWheelTime = 0;
        this.lastWheelDirection = 0;
        this.isAtScrollLimit = false;

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
                    // Remove the original shape from scene - we'll add clones instead
                    this.scene.remove(shape);
                    loadedShapes.push(shape);
                    console.log(`✓ Loaded ${filename}`);
                } catch (e) {
                    console.log(`✗ Could not load ${filename}, using placeholder`);
                    const placeholder = createPlaceholderModel('octahedron', 0xf5f5f0);
                    // Don't add placeholder to scene yet - will be added as instances
                    loadedShapes.push(placeholder);
                }
            }

            // Create small floating instances around the lion - evenly distributed using Fibonacci sphere
            const instances = [];
            const totalShapes = loadedShapes.length * 2; // Create 2 instances per shape
            const goldenRatio = (1 + Math.sqrt(5)) / 2;
            const angleIncrement = Math.PI * 2 * goldenRatio;

            let shapeCounter = 0;

            loadedShapes.forEach((shape, shapeIndex) => {
                // Create 2 instances of each shape for better distribution
                for (let i = 0; i < 2; i++) {
                    const clone = shape.clone();

                    // Use Fibonacci sphere distribution for even scattering
                    const t = shapeCounter / totalShapes;
                    const inclination = Math.acos(1 - 2 * t);
                    const azimuth = angleIncrement * shapeCounter;

                    // Add some randomness to radius for natural look
                    const baseRadius = 7;
                    const radiusVariation = 0.8 + Math.random() * 2;
                    const radius = baseRadius + radiusVariation;

                    clone.position.set(
                        Math.sin(inclination) * Math.cos(azimuth) * radius,
                        (Math.cos(inclination) * radius * 0.7), // Slightly flatten vertically
                        Math.sin(inclination) * Math.sin(azimuth) * radius
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

                    // Store animation data with rotation speeds
                    const baseSpeed = {
                        x: (Math.random() - 0.5) * 0.003,
                        y: (Math.random() - 0.5) * 0.003,
                        z: (Math.random() - 0.5) * 0.003
                    };
                    instances.push({
                        mesh: clone,
                        originalPosition: clone.position.clone(),
                        originalRotation: clone.rotation.clone(),
                        floatOffset: Math.random() * Math.PI * 2,
                        baseRotationSpeed: baseSpeed,
                        currentRotationSpeed: {
                            x: baseSpeed.x,
                            y: baseSpeed.y,
                            z: baseSpeed.z
                        }
                    });

                    this.scene.add(clone);
                    shapeCounter++;
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

            // Create placeholder shapes with even distribution
            const instances = [];
            const shapes = ['cube', 'sphere', 'torus', 'octahedron', 'cube', 'sphere', 'torus', 'octahedron', 'cube', 'sphere', 'torus', 'octahedron', 'cube', 'sphere'];
            const totalShapes = shapes.length;
            const goldenRatio = (1 + Math.sqrt(5)) / 2;
            const angleIncrement = Math.PI * 2 * goldenRatio;

            shapes.forEach((type, i) => {
                const shape = createPlaceholderModel(type, 0xf5f5f0);

                // Use Fibonacci sphere distribution
                const t = i / totalShapes;
                const inclination = Math.acos(1 - 2 * t);
                const azimuth = angleIncrement * i;

                const baseRadius = 7;
                const radiusVariation = 0.8 + Math.random() * 2;
                const radius = baseRadius + radiusVariation;

                shape.position.set(
                    Math.sin(inclination) * Math.cos(azimuth) * radius,
                    (Math.cos(inclination) * radius * 0.7),
                    Math.sin(inclination) * Math.sin(azimuth) * radius
                );

                const scale = 0.15 + Math.random() * 0.25;
                shape.scale.set(scale, scale, scale);

                shape.rotation.set(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );

                const baseSpeed = {
                    x: (Math.random() - 0.5) * 0.003,
                    y: (Math.random() - 0.5) * 0.003,
                    z: (Math.random() - 0.5) * 0.003
                };
                instances.push({
                    mesh: shape,
                    originalPosition: shape.position.clone(),
                    originalRotation: shape.rotation.clone(),
                    floatOffset: Math.random() * Math.PI * 2,
                    baseRotationSpeed: baseSpeed,
                    currentRotationSpeed: {
                        x: baseSpeed.x,
                        y: baseSpeed.y,
                        z: baseSpeed.z
                    }
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
        // Create curved, smooth line geometries for eerie atmosphere
        for (let i = 0; i < 15; i++) {
            const points = [];
            const segmentCount = 50; // More segments for smoother curves

            for (let j = 0; j < segmentCount; j++) {
                const t = j / (segmentCount - 1);
                const angle = t * Math.PI * 4 + i;
                const radius = 3 + i * 0.3;

                // Add smooth wave variations for curvy effect
                const waveX = Math.sin(t * Math.PI * 3 + i) * 0.5;
                const waveZ = Math.cos(t * Math.PI * 2.5 + i * 0.7) * 0.5;

                points.push(new THREE.Vector3(
                    Math.cos(angle) * radius + waveX,
                    (t - 0.5) * 10 + Math.sin(t * Math.PI * 2) * 0.8,
                    Math.sin(angle) * radius + waveZ
                ));
            }

            // Use CatmullRomCurve3 for smooth, rounded curves
            const curve = new THREE.CatmullRomCurve3(points);
            const curvePoints = curve.getPoints(100); // High resolution for smoothness

            const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

            // Use TubeGeometry for rounded appearance instead of flat lines
            const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.015, 8, false);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff6b35,
                transparent: true,
                opacity: 0.05 + Math.random() * 0.1
            });

            const tube = new THREE.Mesh(tubeGeometry, material);
            tube.userData.rotationSpeed = -(0.0003 + Math.random() * 0.0005); // Reversed spiral rotation
            tube.userData.verticalSpeed = 0.002 + Math.random() * 0.003; // Upward movement speed
            tube.userData.initialY = -10 + (i / 15) * 20; // Stagger initial positions to prevent gaps
            tube.userData.maxHeight = 10; // Maximum height before wrapping
            this.scene.add(tube);

            this.objects.ambientLines.push(tube);
        }
    }

    setupEventListeners() {
        // Mouse movement
        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Wheel scroll tracking (captures scroll even when page can't scroll further)
        window.addEventListener('wheel', (e) => {
            const currentTime = performance.now();
            const timeDelta = currentTime - this.lastWheelTime;
            this.lastWheelTime = currentTime;

            // Normalize wheel delta and direction
            const delta = e.deltaY;
            this.lastWheelDirection = delta > 0 ? 1 : -1;

            // Check if at scroll limits
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            const isAtTop = currentScroll <= 0 && delta < 0;
            const isAtBottom = currentScroll >= maxScroll - 1 && delta > 0;
            this.isAtScrollLimit = isAtTop || isAtBottom;

            // Calculate wheel velocity (normalized)
            this.wheelVelocity = timeDelta > 0 ? Math.abs(delta) / Math.max(timeDelta, 16) : 0;
        }, { passive: true });

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
        if (Math.abs(scrollDelta) > 0.1) {
            this.scrollDirection = scrollDelta > 0 ? 1 : -1;  // 1 for down, -1 for up
            this.isScrolling = true;

            // Clear existing timeout and set new one
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }

            // Mark as not scrolling after 150ms of no scroll
            this.scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
            }, 150);
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

        // CAMERA with mouse parallax (like original)
        this.cameraTarget.x = this.mouse.x * 0.5;
        this.cameraTarget.y = 2 + this.mouse.y * 0.3;
        this.cameraTarget.z = 12;

        // Apply smooth camera movement
        this.camera.position.x += (this.cameraTarget.x - this.camera.position.x) * 0.05;
        this.camera.position.y += (this.cameraTarget.y - this.camera.position.y) * 0.05;
        this.camera.position.z += (this.cameraTarget.z - this.camera.position.z) * 0.05;

        // Camera always looks at origin
        this.camera.lookAt(0, 0, 0);

        // ANIMATE MAIN LION MODEL - Moves to recreate original camera orbit effect
        if (this.objects.mainModel) {
            // Original camera positions - these define how the view orbits
            const originalCameraPositions = [
                { x: 0, y: 2, z: 12 },      // Hero - front view
                { x: 8, y: 3, z: 8 },       // Features - right side
                { x: -6, y: 4, z: 10 },     // Experience - left side
                { x: 0, y: 6, z: 14 },      // Gallery - top view
                { x: 4, y: 1, z: 9 }        // Contact - low right
            ];

            // Calculate section
            const sectionProgress = this.scrollProgress * (originalCameraPositions.length - 1);
            const currentSection = Math.floor(sectionProgress);
            const nextSection = Math.min(currentSection + 1, originalCameraPositions.length - 1);
            const sectionBlend = sectionProgress - currentSection;

            // Get virtual camera position (where camera WOULD be orbiting)
            const currentCamPos = originalCameraPositions[currentSection];
            const nextCamPos = originalCameraPositions[nextSection];

            const virtualCamX = currentCamPos.x + (nextCamPos.x - currentCamPos.x) * sectionBlend;
            const virtualCamY = currentCamPos.y + (nextCamPos.y - currentCamPos.y) * sectionBlend;
            const virtualCamZ = currentCamPos.z + (nextCamPos.z - currentCamPos.z) * sectionBlend;

            // Move lion in opposite direction with higher scale for more movement
            const movementScale = 0.6; // Increased from 0.3 for more dramatic movement
            const targetX = -(virtualCamX - 0) * movementScale;
            const targetY = -(virtualCamY - 2) * movementScale;
            const targetZ = -(virtualCamZ - 12) * movementScale;

            // Apply smooth position
            this.objects.mainModel.position.x += (targetX - this.objects.mainModel.position.x) * 0.08;
            this.objects.mainModel.position.y += (targetY - this.objects.mainModel.position.y) * 0.08;
            this.objects.mainModel.position.z += (targetZ - this.objects.mainModel.position.z) * 0.08;

            // Calculate rotation angles based on virtual camera + actual camera (for mouse parallax)
            // Use virtual camera position for main rotation, actual camera for fine-tuning
            const virtualAngleY = Math.atan2(virtualCamX, virtualCamZ);
            const virtualDistXZ = Math.sqrt(virtualCamX * virtualCamX + virtualCamZ * virtualCamZ);
            const virtualAngleX = Math.atan2(virtualCamY, virtualDistXZ);

            // Add mouse parallax influence
            const mouseInfluenceY = (this.camera.position.x - 0) * 0.3;
            const mouseInfluenceX = (this.camera.position.y - 2) * 0.15;

            const targetRotY = virtualAngleY + mouseInfluenceY;
            const targetRotX = -virtualAngleX + mouseInfluenceX;

            // Apply rotation with faster interpolation
            this.objects.mainModel.rotation.y += (targetRotY - this.objects.mainModel.rotation.y) * 0.12;
            this.objects.mainModel.rotation.x += (targetRotX - this.objects.mainModel.rotation.x) * 0.12;
        }

        // ANIMATE FLOATING INSTANCES - ONLY rotate on axis, NO position movement
        if (this.objects.floatingInstances.length > 0) {
            // Decay wheel velocity smoothly
            this.wheelVelocity *= 0.88;

            // Calculate both inputs with normalized scaling
            let pageScrollVelocity = Math.abs(this.scrollVelocity);
            let wheelScrollVelocity = this.wheelVelocity * 8; // Scale wheel to match page scroll magnitude

            // Always combine both inputs for seamless transition (no dead zone)
            let effectiveScrollVelocity = 0;
            let effectiveScrollDirection = 1;

            // Prioritize page scroll, but seamlessly blend in wheel scroll
            if (pageScrollVelocity > 0.01) {
                // Page is actively scrolling - use it primarily
                effectiveScrollVelocity = pageScrollVelocity;
                effectiveScrollDirection = this.scrollDirection;
            } else if (wheelScrollVelocity > 0.01) {
                // No page scroll but wheel is active - use wheel immediately
                effectiveScrollVelocity = wheelScrollVelocity;
                effectiveScrollDirection = this.lastWheelDirection;
            }

            // Additional boost if at scroll limit and wheel is active (no dead zone)
            if (this.isAtScrollLimit && wheelScrollVelocity > 0.01) {
                // Override with wheel velocity immediately
                effectiveScrollVelocity = Math.max(effectiveScrollVelocity, wheelScrollVelocity);
                effectiveScrollDirection = this.lastWheelDirection;
            }

            this.objects.floatingInstances.forEach((instance, index) => {
                const mesh = instance.mesh;

                // Calculate target rotation speed
                let targetSpeedX, targetSpeedY, targetSpeedZ;

                if (effectiveScrollVelocity > 0.01) {
                    // Active scrolling - calculate target speed (lower threshold = no dead zone)
                    const speedMultiplier = 1 + effectiveScrollVelocity * 2;
                    targetSpeedX = instance.baseRotationSpeed.x * effectiveScrollDirection * speedMultiplier;
                    targetSpeedY = instance.baseRotationSpeed.y * effectiveScrollDirection * speedMultiplier;
                    targetSpeedZ = instance.baseRotationSpeed.z * effectiveScrollDirection * speedMultiplier;
                } else {
                    // Idle - maintain direction with base speed
                    const dirX = instance.currentRotationSpeed.x !== 0 ? Math.sign(instance.currentRotationSpeed.x) : 1;
                    const dirY = instance.currentRotationSpeed.y !== 0 ? Math.sign(instance.currentRotationSpeed.y) : 1;
                    const dirZ = instance.currentRotationSpeed.z !== 0 ? Math.sign(instance.currentRotationSpeed.z) : 1;

                    targetSpeedX = instance.baseRotationSpeed.x * dirX;
                    targetSpeedY = instance.baseRotationSpeed.y * dirY;
                    targetSpeedZ = instance.baseRotationSpeed.z * dirZ;
                }

                // Smooth interpolation - faster response to eliminate dead zone
                const lerpFactor = effectiveScrollVelocity > 0.01 ? 0.2 : 0.05;
                instance.currentRotationSpeed.x += (targetSpeedX - instance.currentRotationSpeed.x) * lerpFactor;
                instance.currentRotationSpeed.y += (targetSpeedY - instance.currentRotationSpeed.y) * lerpFactor;
                instance.currentRotationSpeed.z += (targetSpeedZ - instance.currentRotationSpeed.z) * lerpFactor;

                // Apply rotation ONLY - shapes rotate on their axis
                mesh.rotation.x += instance.currentRotationSpeed.x;
                mesh.rotation.y += instance.currentRotationSpeed.y;
                mesh.rotation.z += instance.currentRotationSpeed.z;

                // Keep position COMPLETELY FIXED - only subtle float
                const floatY = Math.sin(elapsedTime * 0.4 + instance.floatOffset) * 0.2;
                mesh.position.copy(instance.originalPosition);
                mesh.position.y += floatY;

                // Subtle breathing
                const breathe = 1 + Math.sin(elapsedTime * 0.5 + instance.floatOffset) * 0.01;
                const baseScale = 0.15 + (instance.floatOffset / (Math.PI * 2)) * 0.25;
                mesh.scale.setScalar(baseScale * breathe);
            });
        }

        // Animate particles - very subtle
        if (this.objects.eerieParticles) {
            this.objects.eerieParticles.rotation.y = elapsedTime * 0.015;

            // Subtle pulsing
            const pulse = Math.sin(elapsedTime * 0.5) * 0.1 + 0.9;
            this.objects.eerieParticles.material.opacity = 0.25 * pulse;
        }

        // Animate ambient lines - ONLY rotate on Y axis, faster speed
        this.objects.ambientLines.forEach((line, index) => {
            // Rotate around Y axis only - faster speed
            line.rotation.y += line.userData.rotationSpeed * 3;

            // Move upward continuously
            line.userData.initialY += line.userData.verticalSpeed;

            // Wrap around when reaching max height (seamless loop)
            if (line.userData.initialY > line.userData.maxHeight) {
                line.userData.initialY -= line.userData.maxHeight * 2;
            }

            // Apply vertical position only - X and Z stay at 0
            line.position.set(0, line.userData.initialY, 0);
        });

        // Update model animations
        this.modelLoader.update(deltaTime);

        this.renderer.render(this.scene, this.camera);
    }
}
