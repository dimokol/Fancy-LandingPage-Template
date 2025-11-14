# 3D Model Setup Guide

This guide explains how to add your custom 3D models to the landing page.

## Directory Structure

```
public/
└── models/
    ├── lion_totem.glb          (Main centerpiece model)
    ├── shape_01.glb            (Small floating instances)
    ├── shape_02.glb
    ├── shape_03.glb
    └── shape_04.glb
```

## Adding Your Models

### 1. Place Models in Public Folder

Upload your `.glb` files to `/public/models/` directory:

```bash
public/models/
├── lion_totem.glb    # Your main lion totem model
├── shape_01.glb      # Additional decorative shapes
├── shape_02.glb
├── shape_03.glb
└── shape_04.glb
```

### 2. Model Requirements

**Main Model (lion_totem.glb):**
- Recommended size: Normalized to 1-2 units
- Format: GLB (binary glTF)
- Should be centered at origin (0, 0, 0)

**Floating Shapes:**
- Smaller decorative models
- Will be duplicated and scattered around the main model
- Should be simple for performance

### 3. Model Behavior

The models will have the following interactions:

**Main Lion Totem:**
- Slow continuous rotation
- Responds to mouse movement
- Scales based on scroll position
- Orange emissive glow effect

**Floating Instances:**
- Gentle floating animation
- Rotate continuously at different speeds
- **Flip when cursor passes over them**
- **Accelerate rotation based on scroll speed**
- **Reverse animation when scrolling up**

## Placeholder Models

If you haven't uploaded models yet, the system uses placeholder geometries:
- Lion: Stylized shape made from spheres and torus
- Shapes: Geometric primitives (cube, sphere, torus, octahedron)

## Color Scheme Applied to Models

All models automatically receive the site's color palette:
- **Base Color**: Ghost White (#f5f5f0)
- **Emissive**: Vibrant Orange (#ff6b35)
- **Metalness**: 0.7
- **Roughness**: 0.3

## Customizing Model Appearance

Edit `/src/modules/threeScene.js` to customize:

```javascript
// Change model scale
options: {
    scale: 2.0,  // Make model bigger
}

// Change model position
options: {
    position: [0, 1, 0],  // x, y, z
}

// Change number of floating instances
this.createFloatingInstances(model, 12, 6);  // count, radius
```

## Performance Notes

- Keep GLB files under 5MB each for best performance
- Use compressed textures if possible
- Models are optimized automatically with:
  - Proper material settings
  - Shadow casting/receiving
  - Emissive glow effects

## Testing

After adding models:

1. Start dev server: `npm run dev`
2. Check browser console for loading errors
3. Models should appear in the hero section
4. Test cursor interactions and scroll effects

## Troubleshooting

**Models not appearing:**
- Check file paths are correct
- Verify GLB files are valid (test in tools like https://gltf-viewer.donmccurdy.com/)
- Check browser console for errors

**Models too big/small:**
- Adjust scale in `threeScene.js`
- Or normalize in 3D software before export

**Performance issues:**
- Reduce polygon count
- Simplify textures
- Decrease number of floating instances

---

**Note**: The system will work with placeholder geometries until you upload your models. This allows you to see the interactions and effects before finalizing your 3D assets.
