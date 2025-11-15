// Image/Element Distortion Shader
// Creates RGB shift and displacement effects

export const distortionVertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const distortionFragmentShader = `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    uniform float uDistortionStrength;

    varying vec2 vUv;

    // Simple noise function
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
        vec2 uv = vUv;

        // Distance from mouse
        float mouseDist = distance(uv, uMouse);
        float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * uHover;

        // Create distortion
        float noiseValue = noise(uv * 10.0 + uTime);
        vec2 distortion = vec2(
            noise(uv * 8.0 + uTime * 0.5),
            noise(uv * 8.0 - uTime * 0.3)
        ) * 2.0 - 1.0;

        distortion *= uDistortionStrength * (0.5 + mouseInfluence);

        // RGB Shift
        float shift = 0.01 * mouseInfluence * uDistortionStrength;

        float r = texture2D(uTexture, uv + distortion * 0.02 + vec2(shift, 0.0)).r;
        float g = texture2D(uTexture, uv + distortion * 0.015).g;
        float b = texture2D(uTexture, uv + distortion * 0.02 - vec2(shift, 0.0)).b;

        vec3 color = vec3(r, g, b);

        // Add chromatic glow on hover
        if(mouseInfluence > 0.1) {
            color += vec3(0.1, 0.0, 0.2) * mouseInfluence;
        }

        gl_FragColor = vec4(color, 1.0);
    }
`;
