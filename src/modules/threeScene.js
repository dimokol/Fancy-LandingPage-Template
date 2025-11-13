// Main Three.js Scene Manager
// Handles 3D background, particles, and interactive 3D elements

import * as THREE from 'three';
import { fluidVertexShader, fluidFragmentShader } from '../shaders/fluidBackground.js';
import { particleVertexShader, particleFragmentShader } from '../shaders/particleShader.js';

export class ThreeScene {
    constructor(canvas, cursor) {
        this.canvas = canvas;
        this.cursor = cursor;

        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Time and mouse
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();

        // 3D Objects storage
        this.objects = {
            fluidBackground: null,
            particles: null,
            featureIcons: [],
            heroSphere: null,
            experienceVisual: null
        };

        this.init();
    }

    init() {
        this.createFluidBackground();
        this.createParticles();
        this.createFeatureIcons();
        this.createHeroSphere();
        this.createExperienceVisual();

        this.setupEventListeners();
        this.animate();
    }

    createFluidBackground() {
        const geometry = new THREE.PlaneGeometry(20, 20, 1, 1);

        const material = new THREE.ShaderMaterial({
            vertexShader: fluidVertexShader,
            fragmentShader: fluidFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                uMouseInfluence: { value: 0.3 }
            }
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -5;
        this.scene.add(mesh);

        this.objects.fluidBackground = mesh;
    }

    createParticles() {
        const count = 500;
        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        const randomness = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Spread particles in a volume
            positions[i3] = (Math.random() - 0.5) * 20;
            positions[i3 + 1] = (Math.random() - 0.5) * 20;
            positions[i3 + 2] = (Math.random() - 0.5) * 10;

            scales[i] = Math.random();

            randomness[i3] = Math.random();
            randomness[i3 + 1] = Math.random();
            randomness[i3 + 2] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
        geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));

        const material = new THREE.ShaderMaterial({
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uSize: { value: 8.0 },
                uMouse: { value: new THREE.Vector2(0, 0) }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.objects.particles = particles;
    }

    createFeatureIcons() {
        const iconTypes = [
            { type: 'cube', geometry: new THREE.BoxGeometry(1, 1, 1) },
            { type: 'sphere', geometry: new THREE.SphereGeometry(0.6, 32, 32) },
            { type: 'torus', geometry: new THREE.TorusGeometry(0.5, 0.2, 16, 100) },
            { type: 'octahedron', geometry: new THREE.OctahedronGeometry(0.7) }
        ];

        const iconContainers = document.querySelectorAll('.icon-3d');

        iconContainers.forEach((container, index) => {
            const iconType = container.dataset.icon;
            const iconData = iconTypes.find(t => t.type === iconType) || iconTypes[0];

            // Create mini scene for each icon
            const miniScene = new THREE.Scene();
            const miniCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
            miniCamera.position.z = 3;

            // Create material with gradient effect
            const material = new THREE.MeshStandardMaterial({
                color: 0x00d4ff,
                emissive: 0x8b5cf6,
                emissiveIntensity: 0.5,
                metalness: 0.8,
                roughness: 0.2
            });

            const mesh = new THREE.Mesh(iconData.geometry, material);
            miniScene.add(mesh);

            // Lighting
            const light1 = new THREE.PointLight(0xff006e, 2, 10);
            light1.position.set(2, 2, 2);
            miniScene.add(light1);

            const light2 = new THREE.PointLight(0x00d4ff, 2, 10);
            light2.position.set(-2, -2, 2);
            miniScene.add(light2);

            // Create renderer for this icon
            const miniCanvas = document.createElement('canvas');
            const miniRenderer = new THREE.WebGLRenderer({
                canvas: miniCanvas,
                alpha: true,
                antialias: true
            });
            miniRenderer.setSize(80, 80);
            miniRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            container.appendChild(miniCanvas);

            this.objects.featureIcons.push({
                scene: miniScene,
                camera: miniCamera,
                renderer: miniRenderer,
                mesh: mesh,
                container: container
            });
        });
    }

    createHeroSphere() {
        const geometry = new THREE.IcosahedronGeometry(2, 4);

        // Create custom material with wireframe overlay
        const material = new THREE.MeshStandardMaterial({
            color: 0x8b5cf6,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.3,
            metalness: 0.9,
            roughness: 0.1,
            wireframe: false
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Wireframe overlay
        const wireframeGeometry = new THREE.WireframeGeometry(geometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0xff006e,
            transparent: true,
            opacity: 0.3
        });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        mesh.add(wireframe);

        // Add lights
        const light1 = new THREE.PointLight(0x00d4ff, 3, 20);
        light1.position.set(5, 5, 5);
        this.scene.add(light1);

        const light2 = new THREE.PointLight(0xff006e, 3, 20);
        light2.position.set(-5, -5, 5);
        this.scene.add(light2);

        mesh.position.set(0, 0, 0);
        this.scene.add(mesh);

        this.objects.heroSphere = mesh;
    }

    createExperienceVisual() {
        // Create a morphing torus knot for the experience section
        const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);

        const material = new THREE.MeshStandardMaterial({
            color: 0xd946ff,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.4,
            metalness: 0.8,
            roughness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(3, 0, -2);

        this.scene.add(mesh);
        this.objects.experienceVisual = mesh;
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

            if (this.objects.fluidBackground) {
                this.objects.fluidBackground.material.uniforms.uResolution.value.set(
                    window.innerWidth,
                    window.innerHeight
                );
            }
        });
    }

    updateOnScroll(scrollProgress) {
        // Move camera based on scroll
        this.camera.position.y = -scrollProgress * 10;

        // Rotate hero sphere
        if (this.objects.heroSphere) {
            this.objects.heroSphere.rotation.y = scrollProgress * Math.PI * 2;
        }

        // Move experience visual
        if (this.objects.experienceVisual) {
            this.objects.experienceVisual.position.y = Math.sin(scrollProgress * Math.PI) * 2;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsedTime = this.clock.getElapsedTime();

        // Smooth mouse lerp
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        // Update fluid background
        if (this.objects.fluidBackground) {
            const material = this.objects.fluidBackground.material;
            material.uniforms.uTime.value = elapsedTime;

            const cursorPos = this.cursor.getPosition();
            material.uniforms.uMouse.value.set(cursorPos.x, 1.0 - cursorPos.y);
        }

        // Update particles
        if (this.objects.particles) {
            const material = this.objects.particles.material;
            material.uniforms.uTime.value = elapsedTime;
            material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);

            this.objects.particles.rotation.y = elapsedTime * 0.05;
        }

        // Animate hero sphere
        if (this.objects.heroSphere) {
            this.objects.heroSphere.rotation.x = elapsedTime * 0.2;
            this.objects.heroSphere.rotation.y = elapsedTime * 0.3;

            // Float animation
            this.objects.heroSphere.position.y = Math.sin(elapsedTime * 0.5) * 0.3;

            // Mouse interaction
            this.objects.heroSphere.rotation.x += this.mouse.y * 0.02;
            this.objects.heroSphere.rotation.y += this.mouse.x * 0.02;
        }

        // Animate experience visual
        if (this.objects.experienceVisual) {
            this.objects.experienceVisual.rotation.x = elapsedTime * 0.3;
            this.objects.experienceVisual.rotation.y = elapsedTime * 0.2;
        }

        // Animate feature icons
        this.objects.featureIcons.forEach((icon, index) => {
            icon.mesh.rotation.x = elapsedTime * 0.5 + index;
            icon.mesh.rotation.y = elapsedTime * 0.3 + index;

            // Check if hovered
            const rect = icon.container.getBoundingClientRect();
            const mouseX = this.cursor.mouseX;
            const mouseY = this.cursor.mouseY;

            const isHovered = mouseX >= rect.left && mouseX <= rect.right &&
                            mouseY >= rect.top && mouseY <= rect.bottom;

            if (isHovered) {
                icon.mesh.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
            } else {
                icon.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
            }

            icon.renderer.render(icon.scene, icon.camera);
        });

        // Camera subtle movement
        this.camera.position.x = this.mouse.x * 0.5;
        this.camera.position.y += (this.mouse.y * 0.5 - this.camera.position.y) * 0.05;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    }
}
