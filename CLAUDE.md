# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ethereal Void is an ultra-modern, interactive landing page template featuring advanced Three.js 3D effects, custom GLSL shaders, and immersive animations. The project showcases a "vibrant yet eerie" aesthetic with extensive use of custom cursor interactions, particle systems, and scroll-driven animations.

## Development Commands

```bash
# Start development server (runs on http://localhost:3014)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Core Application Structure

The application follows a modular architecture with a central orchestrator pattern:

- **Main Entry Point** (`src/main.js`): The `EtherealVoid` class initializes and coordinates all subsystems
  - Initializes Lenis smooth scrolling
  - Sets up GSAP with ScrollTrigger integration
  - Coordinates between cursor, scroll animations, and Three.js scene
  - Manages form interactions, gallery effects, and tilt effects

### Key Subsystems

1. **Three.js Scene** (`src/modules/threeScene.js`)
   - Central 3D rendering system with WebGL
   - Manages main model, floating instances, particles, and ambient lines
   - Implements scroll-based camera movement and object animations
   - Uses `ModelLoader` for 3D model loading with placeholder fallbacks
   - Scroll tracking with smooth interpolation to prevent snap-back bugs
   - Wheel scroll tracking for interactions beyond page scroll limits

2. **Custom Cursor** (`src/modules/cursor.js`)
   - SVG-based cursor with rotating text banner
   - Magnetic attraction to interactive elements (data-magnetic attribute)
   - Idle detection with particle circle effects
   - Speed-based trail particle system
   - Edge/corner detection for special behaviors
   - Uses mix-blend-mode: difference for visual effect

3. **Scroll Animations** (`src/modules/scrollAnimations.js`)
   - ScrollTrigger-based progress tracking
   - Counter animations with easing
   - Coordinates with Three.js scene via callback system

4. **Text Scramble** (`src/modules/textScramble.js`)
   - Animated text scrambling effects
   - Used for dynamic text reveals

5. **Shaders** (`src/shaders/`)
   - `fluidBackground.js`: Perlin noise-based organic background patterns
   - `particleShader.js`: Custom particle rendering with glow effects
   - `distortionShader.js`: Image distortion and chromatic aberration effects

### Key Integration Points

- **Lenis ↔ GSAP**: Lenis scroll events update ScrollTrigger via `gsap.ticker`
- **Scroll ↔ Three.js**: `ScrollAnimations.onScrollProgress()` callback updates camera and 3D objects
- **Cursor ↔ Three.js**: Cursor instance passed to ThreeScene for mouse-based 3D interactions

## Design System

### Color Palette
The project uses CSS custom properties defined in `src/styles/main.css`:
- `--void-black`: #0a0a0f (deep black)
- `--electric-blue`: #00d4ff (vibrant blue)
- `--neon-pink`: #ff006e (neon pink)
- `--neon-magenta`: #d946ff (vivid magenta)
- `--ethereal-purple`: #8b5cf6 (purple accent)

### Interactive Elements
- Elements with `data-magnetic` attribute: Custom cursor applies magnetic attraction
- Elements with `data-tilt` attribute: 3D tilt effect on mouse movement
- `.cta-button`, `.nav-link`: GSAP hover animations
- `.feature-card`, `.gallery-item`: Scroll-triggered reveals with stagger

## Performance Considerations

- **Pixel Ratio**: Capped at 2 for high-DPI displays to maintain performance
- **Single Animation Loop**: All animations run in a single `requestAnimationFrame` loop
- **Geometry Reuse**: Shared geometries for instanced 3D objects
- **Mobile Detection**: Custom cursor disabled on touch devices
- **Build Optimization**: Vite with esbuild minification

## Common Patterns

### Adding Scroll Animations
Use GSAP with ScrollTrigger. Example pattern from `src/main.js`:
```javascript
gsap.from('.element', {
    scrollTrigger: {
        trigger: '.section',
        start: 'top 80%',
    },
    y: 50,
    opacity: 0,
    duration: 1,
    ease: 'power3.out'
});
```

### Creating 3D Objects in Three.js Scene
Add objects in `threeScene.js` initialization methods (`createMainModel`, `createEerieParticles`, etc.). Store references in `this.objects` for animation updates in `animate()` loop.

### Cursor Interactions
Add `data-magnetic` attribute to HTML elements for magnetic cursor effect. The cursor system automatically detects and applies attraction forces.

## Important Notes

- The project uses Vite's ES module system - all imports must use `.js` extensions
- GSAP ScrollTrigger must be registered before use: `gsap.registerPlugin(ScrollTrigger)`
- Lenis smooth scroll is integrated with GSAP ticker - don't create separate scroll listeners
- Three.js scene uses a single renderer per canvas; feature icons use separate mini-renderers
- Custom cursor uses `mix-blend-mode: difference` - be aware of color inversion on light backgrounds
