// Advanced Particle System Shaders
// Creates floating particles with glow effects

export const particleVertexShader = `
    uniform float uTime;
    uniform float uSize;
    uniform vec2 uMouse;

    attribute float aScale;
    attribute vec3 aRandomness;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        vec3 pos = position;

        // Floating animation
        float t = uTime * 0.5;
        pos.x += sin(t + aRandomness.x * 10.0) * 0.5;
        pos.y += cos(t + aRandomness.y * 10.0) * 0.5;
        pos.z += sin(t + aRandomness.z * 10.0) * 0.3;

        // Mouse repulsion
        vec3 mousePos3D = vec3(uMouse * 2.0 - 1.0, 0.0);
        vec3 toMouse = pos - mousePos3D;
        float mouseDist = length(toMouse);

        if(mouseDist < 1.0) {
            pos += normalize(toMouse) * (1.0 - mouseDist) * 0.5;
        }

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Size based on distance
        gl_PointSize = uSize * aScale * (300.0 / -mvPosition.z);

        // Color variation
        float colorShift = aRandomness.x;
        if(colorShift < 0.33) {
            vColor = vec3(0.0, 0.83, 1.0); // Electric Blue
        } else if(colorShift < 0.66) {
            vColor = vec3(1.0, 0.0, 0.43); // Neon Pink
        } else {
            vColor = vec3(0.85, 0.29, 1.0); // Neon Magenta
        }

        // Alpha variation
        vAlpha = 0.3 + aRandomness.y * 0.5;
    }
`;

export const particleFragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        // Create circular particles with glow
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);

        // Soft edge
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

        // Add glow
        float glow = 1.0 / (1.0 + dist * 20.0);

        vec3 finalColor = vColor + glow * 0.5;

        gl_FragColor = vec4(finalColor, alpha * vAlpha);
    }
`;
