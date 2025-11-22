// GLB Model Loader and Manager
// Loads and animates 3D models with cursor interaction

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
    constructor(scene, cursor) {
        this.scene = scene;
        this.cursor = cursor;
        this.loader = new GLTFLoader();
        this.models = new Map();
        this.scrollSpeed = 0;
        this.lastScrollY = 0;
    }

    /**
     * Load a GLB model
     * @param {string} path - Path to the GLB file
     * @param {object} options - Loading options
     * @returns {Promise<THREE.Group>}
     */
    async loadModel(path, options = {}) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;

                    // Apply options
                    if (options.scale) {
                        model.scale.set(options.scale, options.scale, options.scale);
                    }

                    if (options.position) {
                        model.position.set(...options.position);
                    }

                    if (options.rotation) {
                        model.rotation.set(...options.rotation);
                    }

                    // Apply white reflective material that responds to lighting
                    model.traverse((child) => {
                        if (child.isMesh) {
                            // Create highly reflective white material
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xffffff,           // Pure white base
                                metalness: 0.3,            // Less metallic for softer reflections
                                roughness: 0.2,            // Smooth surface
                                envMapIntensity: 1.5,      // Enhanced environment reflections
                                flatShading: false,        // Smooth shading for better light response
                            });

                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // Store model data
                    this.models.set(options.name || path, {
                        model,
                        mixer: gltf.animations.length > 0 ? new THREE.AnimationMixer(model) : null,
                        animations: gltf.animations,
                        options
                    });

                    this.scene.add(model);
                    resolve(model);
                },
                (progress) => {
                    if (options.onProgress) {
                        options.onProgress(progress);
                    }
                },
                (error) => {
                    console.error(`Error loading model ${path}:`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Create small floating instances around the main model
     * @param {THREE.Object3D} sourceModel - Model to instance
     * @param {number} count - Number of instances
     * @param {number} radius - Radius of distribution
     */
    createFloatingInstances(sourceModel, count = 8, radius = 5) {
        const instances = [];

        for (let i = 0; i < count; i++) {
            const clone = sourceModel.clone();

            // Position in a sphere around origin
            const theta = (i / count) * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = radius + Math.random() * 2;

            clone.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );

            // Random scale
            const scale = 0.2 + Math.random() * 0.3;
            clone.scale.set(scale, scale, scale);

            // Random rotation
            clone.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Store animation data
            instances.push({
                mesh: clone,
                originalPosition: clone.position.clone(),
                originalRotation: clone.rotation.clone(),
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                },
                floatOffset: Math.random() * Math.PI * 2,
                flipSpeed: 0,
                flipAxis: new THREE.Vector3(0, 1, 0)
            });

            this.scene.add(clone);
        }

        return instances;
    }

    /**
     * Update floating instances animation
     * @param {Array} instances - Array of instance objects
     * @param {number} time - Current time
     * @param {number} scrollProgress - Scroll progress (0-1)
     */
    updateFloatingInstances(instances, time, scrollProgress) {
        const cursorPos = this.cursor.getNormalizedPosition();

        instances.forEach((instance, index) => {
            const mesh = instance.mesh;

            // Base rotation animation (accelerated by scroll)
            const scrollMultiplier = 1 + Math.abs(this.scrollSpeed) * 5;

            mesh.rotation.x += instance.rotationSpeed.x * scrollMultiplier;
            mesh.rotation.y += instance.rotationSpeed.y * scrollMultiplier;
            mesh.rotation.z += instance.rotationSpeed.z * scrollMultiplier;

            // Floating motion
            const floatY = Math.sin(time * 0.5 + instance.floatOffset) * 0.5;
            mesh.position.y = instance.originalPosition.y + floatY;

            // Cursor proximity detection and flip effect
            const meshScreenPos = this.getScreenPosition(mesh);
            const distanceToCursor = Math.sqrt(
                Math.pow(meshScreenPos.x - cursorPos.x, 2) +
                Math.pow(meshScreenPos.y - cursorPos.y, 2)
            );

            if (distanceToCursor < 0.3 && instance.flipSpeed === 0) {
                // Calculate flip direction based on cursor movement
                const flipDirection = new THREE.Vector3(
                    cursorPos.x - meshScreenPos.x,
                    cursorPos.y - meshScreenPos.y,
                    0
                ).normalize();

                instance.flipAxis = new THREE.Vector3(
                    -flipDirection.y,
                    flipDirection.x,
                    0
                );

                instance.flipSpeed = 0.2;
            }

            // Apply flip animation
            if (instance.flipSpeed > 0) {
                mesh.rotateOnAxis(instance.flipAxis, instance.flipSpeed);
                instance.flipSpeed *= 0.92; // Decay

                if (instance.flipSpeed < 0.01) {
                    instance.flipSpeed = 0;
                }
            }
        });
    }

    /**
     * Get screen position of a 3D object
     */
    getScreenPosition(object) {
        const vector = object.position.clone();
        const camera = this.scene.parent?.camera || this.scene.children.find(c => c.isCamera);

        if (camera) {
            vector.project(camera);
            return { x: vector.x, y: vector.y };
        }

        return { x: 0, y: 0 };
    }

    /**
     * Update scroll speed for animations
     */
    updateScrollSpeed(currentScrollY) {
        this.scrollSpeed = (currentScrollY - this.lastScrollY) / 100;
        this.lastScrollY = currentScrollY;
    }

    /**
     * Animate loaded models
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        this.models.forEach((modelData) => {
            if (modelData.mixer) {
                modelData.mixer.update(deltaTime);
            }
        });
    }

    /**
     * Get a loaded model by name
     */
    getModel(name) {
        return this.models.get(name);
    }

    /**
     * Remove a model from the scene
     */
    removeModel(name) {
        const modelData = this.models.get(name);
        if (modelData) {
            this.scene.remove(modelData.model);
            this.models.delete(name);
        }
    }
}

// Placeholder model creation (for when GLB files are not available)
export function createPlaceholderModel(type = 'lion', color = 0xf5f5f0) {
    let geometry;

    switch (type) {
        case 'lion':
            // Create a stylized lion-like shape using geometries
            const group = new THREE.Group();

            // Body (elongated sphere)
            const bodyGeometry = new THREE.SphereGeometry(1, 32, 32);
            bodyGeometry.scale(1.2, 0.8, 0.8);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.3,
                roughness: 0.2,
                envMapIntensity: 1.5,
                flatShading: false
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            // Head (sphere)
            const headGeometry = new THREE.SphereGeometry(0.6, 32, 32);
            const head = new THREE.Mesh(headGeometry, bodyMaterial.clone());
            head.position.set(0, 0.5, 0.8);
            head.castShadow = true;
            head.receiveShadow = true;
            group.add(head);

            // Mane (torus)
            const maneGeometry = new THREE.TorusGeometry(0.7, 0.2, 16, 32);
            const mane = new THREE.Mesh(maneGeometry, bodyMaterial.clone());
            mane.position.copy(head.position);
            mane.rotation.x = Math.PI / 2;
            mane.castShadow = true;
            mane.receiveShadow = true;
            group.add(mane);

            return group;

        case 'cube':
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;

        case 'sphere':
            geometry = new THREE.SphereGeometry(0.5, 32, 32);
            break;

        case 'torus':
            geometry = new THREE.TorusGeometry(0.4, 0.15, 16, 100);
            break;

        case 'octahedron':
            geometry = new THREE.OctahedronGeometry(0.5);
            break;

        default:
            geometry = new THREE.IcosahedronGeometry(0.5, 0);
    }

    if (geometry) {
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.2,
            envMapIntensity: 1.5,
            flatShading: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }
}
