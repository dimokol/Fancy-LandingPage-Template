# 🌌 Ethereal Void - Ultra-Modern Landing Page

A cutting-edge, aesthetically stunning landing page featuring advanced Three.js effects, custom GLSL shaders, and immersive interactions. This project showcases the latest in web design trends with a unique "vibrant yet eerie" aesthetic.

![Status](https://img.shields.io/badge/status-production-success)
![Three.js](https://img.shields.io/badge/three.js-r160-blue)
![GSAP](https://img.shields.io/badge/gsap-3.12-green)

## ✨ Features

### 🎨 Visual Effects
- **Fluid 3D Background**: Custom GLSL shaders with Perlin noise creating organic, flowing patterns
- **Particle System**: 500+ interactive particles with additive blending and glow effects
- **RGB Shift & Chromatic Aberration**: Dynamic color separation effects on hover
- **Vibrant Color Palette**: Electric blues, neon pinks, deep purples, and ethereal magentas

### 🖱️ Interactions
- **Magnetic Custom Cursor**: Follows mouse with smooth easing and pulls toward interactive elements
- **Cursor Trail Effect**: Radial gradient trail with blend modes for ethereal effect
- **3D Hover Effects**: Cards tilt and transform in 3D space on hover
- **Scroll-Driven Animations**: Parallax effects and 3D transformations tied to scroll position

### 🎭 3D Elements
- **Hero Sphere**: Animated icosahedron with wireframe overlay and dynamic lighting
- **Feature Icons**: Four unique 3D shapes (cube, sphere, torus, octahedron) with independent renderers
- **Experience Visual**: Morphing torus knot with real-time animations
- **Dynamic Lighting**: Point lights that follow elements and create atmospheric effects

### 🎬 Animations
- **GSAP ScrollTrigger**: Advanced scroll-based animations with stagger effects
- **Lenis Smooth Scroll**: Buttery-smooth scrolling with customizable easing
- **Counter Animations**: Animated statistics with easing functions
- **Form Interactions**: Input focus effects with animated underlines
- **Gallery Effects**: Scale and parallax on hover with smooth transitions

### 📱 Responsive Design
- Fully responsive layout adapting to all screen sizes
- Mobile-optimized (custom cursor disabled on touch devices)
- Performance-conscious with pixel ratio limiting

## 🛠️ Technology Stack

- **Build Tool**: Vite 5.x (Lightning-fast HMR and optimized builds)
- **3D Library**: Three.js r160 (WebGL rendering)
- **Animation**: GSAP 3.12 with ScrollTrigger
- **Smooth Scroll**: Lenis 1.0
- **Languages**: JavaScript (ES6+), GLSL (Shaders), CSS3, HTML5

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will start at `http://localhost:3000`

## 📁 Project Structure

```
Fancy-LandingPage-Template/
├── src/
│   ├── main.js                    # Main application entry
│   ├── styles/
│   │   └── main.css              # All styles with CSS variables
│   ├── modules/
│   │   ├── cursor.js             # Custom cursor system
│   │   ├── scrollAnimations.js  # Scroll-based animations
│   │   └── threeScene.js         # Three.js scene management
│   └── shaders/
│       ├── fluidBackground.js    # Background shader with noise
│       ├── particleShader.js     # Particle system shaders
│       └── distortionShader.js   # Image distortion effects
├── index.html                     # Main HTML file
├── vite.config.js                # Vite configuration
└── package.json                  # Dependencies and scripts
```

## 🎨 Design Philosophy

### Vibrant Yet Eerie Aesthetic
The design combines:
- **Vibrant**: Electric blues (#00d4ff), neon pinks (#ff006e), and vivid magentas (#d946ff)
- **Eerie**: Deep purples (#1a0633), void black (#0a0a0f), and mysterious atmospherics
- **Abstract**: Organic flowing shapes, particle systems, and morphing geometries

### Character Consistency
Every element follows the design language:
- Glowing effects with box-shadows
- Smooth, rounded corners (border-radius: 15-20px)
- Gradient overlays and color transitions
- Consistent spacing and typography
- Interactive feedback on all elements

## 🎯 Key Components

### 1. Fluid Background
Uses fragment shaders with fractal Brownian motion (fBm) to create organic, ever-changing patterns. The noise function creates depth with multiple octaves.

### 2. Particle System
500 particles distributed in 3D space with:
- Individual scaling and randomness
- Mouse repulsion physics
- Color variation (3 color schemes)
- Additive blending for glow effect

### 3. Custom Cursor
Features:
- Smooth easing (lerp with 0.15 factor)
- Magnetic pull to interactive elements
- Lagging trail effect
- Scale transformation on hover
- Mix-blend-mode: difference for contrast

### 4. Scroll Animations
- Progress bar tracking scroll position
- Counter animations with easing
- Element reveal on scroll into view
- 3D camera movement tied to scroll
- Parallax effects with different speeds

## 🎬 Performance Optimizations

- **Pixel Ratio Limiting**: Capped at 2 for high-DPI displays
- **Geometry Reuse**: Shared geometries for instanced objects
- **Shader Optimization**: Efficient noise functions
- **Animation Frame Management**: Single RAF loop
- **Lazy Loading**: Components initialize on scroll into view
- **Build Optimization**: Terser minification, tree-shaking

## 🎨 Customization

### Colors
Edit CSS variables in `src/styles/main.css`:
```css
:root {
    --void-black: #0a0a0f;
    --electric-blue: #00d4ff;
    --neon-pink: #ff006e;
    --neon-magenta: #d946ff;
    --ethereal-purple: #8b5cf6;
}
```

### Particles
Adjust particle count in `src/modules/threeScene.js`:
```javascript
const count = 500; // Increase/decrease for more/fewer particles
```

### Scroll Speed
Modify Lenis duration in `src/main.js`:
```javascript
duration: 1.2 // Lower = faster, Higher = slower
```

## 🌟 Unique Features

This landing page implements several cutting-edge techniques:

1. **Custom Shader Pipeline**: Hand-written GLSL shaders for unique visual effects
2. **Multi-Scene Rendering**: Independent Three.js renderers for feature icons
3. **Physics-Based Interactions**: Mouse repulsion and attraction forces
4. **Chromatic Effects**: RGB channel separation for retro-futuristic look
5. **Morphing Geometries**: Real-time 3D shape transformations

## 📱 Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

Requires WebGL 2.0 support.

## 🤝 Contributing

This is a template project. Feel free to:
- Fork and customize
- Add your own content and sections
- Modify colors and effects
- Create variants for different use cases

## 📄 License

MIT License - feel free to use in personal and commercial projects.

## 🙏 Credits

**Inspiration**:
- Awwwards winning websites
- Studio Freight
- Make Me Pulse
- Active Theory

**Libraries**:
- Three.js by Mr.doob
- GSAP by GreenSock
- Lenis by Studio Freight

## 📞 Support

For issues or questions, please open a GitHub issue.

---

**Made with ✨ and lots of ☕**

*"Where reality bends and imagination transcends"*
