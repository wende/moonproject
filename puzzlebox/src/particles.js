import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.particleGroups = new Map();

    // Performance optimization: Add frame skipping - less aggressive
    this.frameCount = 0;
    this.updateInterval = 1; // Update every frame (removed frame skipping)
    
    // Store original spread values for each particle type
    this.originalSpreads = {
      dust: { x: 30, y: 10, z: 30 },
      sparkles: { x: 25, y: 8, z: 25 },
      lightRays: { x: 22, y: 10, z: 22 },
      cosmicOrbs: { x: 20, y: 8, z: 20 }
    };
    
    // Reduced particle counts for better memory usage
    this.originalCounts = {
      dust: 100, // Reduced from 150
      sparkles: 50, // Reduced from 80
      lightRays: 15, // Reduced from 25
      cosmicOrbs: 10 // Reduced from 15
    };
    
    // Current completion progress (0.0 to 1.0)
    this.completionProgress = 0;

    // Object pooling for better memory management
    this.geometryPool = new Map();
    this.materialPool = new Map();
  }

  // Get or create geometry from pool
  getGeometryFromPool(type, count) {
    const key = `${type}_${count}`;
    if (!this.geometryPool.has(key)) {
      const geometry = new THREE.BufferGeometry();
      this.geometryPool.set(key, geometry);
    }
    return this.geometryPool.get(key);
  }

  // Get or create material from pool
  getMaterialFromPool(type, options = {}) {
    const key = `${type}_${JSON.stringify(options)}`;
    if (!this.materialPool.has(key)) {
      const material = this.createMaterial(type, options);
      this.materialPool.set(key, material);
    }
    return this.materialPool.get(key);
  }

  // Create material with optimized settings
  createMaterial(type, options = {}) {
    const baseOptions = {
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    };

    switch (type) {
      case 'dust':
        return new THREE.PointsMaterial({
          ...baseOptions,
          opacity: 0.3,
          size: 0.08
        });
      case 'sparkles':
        return new THREE.PointsMaterial({
          ...baseOptions,
          opacity: 0.6,
          size: 0.12
        });
      case 'lightRays':
        return new THREE.PointsMaterial({
          ...baseOptions,
          opacity: 0.5,
          size: 0.15
        });
      case 'cosmicOrbs':
        return new THREE.PointsMaterial({
          ...baseOptions,
          opacity: 0.7,
          size: 0.2
        });
      default:
        return new THREE.PointsMaterial(baseOptions);
    }
  }

  // Create floating dust particles (background only) - optimized
  createDustParticles(count = 100, customSpread = null, sizeMultiplier = 1.0) {
    const geometry = this.getGeometryFromPool('dust', count);
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Use custom spread or default to original values
    const spread = customSpread || this.originalSpreads.dust;

    for (let i = 0; i < count; i++) {
      // Random positions in background areas only
      positions[i * 3] = (Math.random() - 0.5) * spread.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;

      // Reduced velocities for subtler movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.006;
      velocities[i * 3 + 1] = Math.random() * 0.003;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.006;

      // More varied colors - cosmic dust
      const color = new THREE.Color();
      const colorType = Math.random();
      if (colorType < 0.4) {
        color.setHSL(0.6, 0.2, 0.7 + Math.random() * 0.3);
      } else if (colorType < 0.7) {
        color.setHSL(0.8, 0.3, 0.6 + Math.random() * 0.4);
      } else {
        color.setHSL(0.12, 0.4, 0.6 + Math.random() * 0.4);
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Varying sizes with size multiplier
      sizes[i] = (0.01 + Math.random() * 0.02) * sizeMultiplier;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = this.getMaterialFromPool('dust');
    const points = new THREE.Points(geometry, material);
    points.userData = { velocities: velocities, originalSizes: [...sizes] };
    points.frustumCulled = false;

    this.particleGroups.set('dust', points);
    this.scene.add(points);

    return points;
  }

  // Create magical sparkles (background only) - optimized
  createSparkles(count = 50, customSpread = null, sizeMultiplier = 1.0) {
    const geometry = this.getGeometryFromPool('sparkles', count);
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Use custom spread or default to original values
    const spread = customSpread || this.originalSpreads.sparkles;

    for (let i = 0; i < count; i++) {
      // Random positions in background areas only
      positions[i * 3] = (Math.random() - 0.5) * spread.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;

      // Reduced velocities for subtler movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = Math.random() * 0.006;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      // More varied sparkle colors - magical spectrum
      const color = new THREE.Color();
      const sparkleType = Math.random();
      if (sparkleType < 0.3) {
        color.setHSL(0.12 + Math.random() * 0.05, 0.9, 0.6 + Math.random() * 0.4);
      } else if (sparkleType < 0.6) {
        color.setHSL(0.6, 0.1, 0.8 + Math.random() * 0.2);
      } else if (sparkleType < 0.8) {
        color.setHSL(0.8, 0.7, 0.5 + Math.random() * 0.5);
      } else {
        color.setHSL(Math.random(), 0.8, 0.6 + Math.random() * 0.4);
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Varying sizes for more dynamic effect with size multiplier
      sizes[i] = (0.003 + Math.random() * 0.005) * sizeMultiplier;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = this.getMaterialFromPool('sparkles');
    const points = new THREE.Points(geometry, material);
    points.userData = { velocities: velocities, originalSizes: [...sizes] };
    points.frustumCulled = false;

    this.particleGroups.set('sparkles', points);
    this.scene.add(points);

    return points;
  }

  // Create ambient light rays (background only)
  createLightRays(count = 15, customSpread = null, sizeMultiplier = 1.0) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Use custom spread or default to original values
    const spread = customSpread || this.originalSpreads.lightRays;

    for (let i = 0; i < count; i++) {
      // Position rays in background areas only
      positions[i * 3] = (Math.random() - 0.5) * spread.x; // Wider spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y; // Full height range, including below ground
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z; // Deeper background

      // Enhanced light ray colors
      const color = new THREE.Color();
      const rayType = Math.random();
      if (rayType < 0.5) {
        // Soft blue-white rays
        color.setHSL(0.6, 0.4, 0.7 + Math.random() * 0.3);
      } else if (rayType < 0.8) {
        // Golden rays
        color.setHSL(0.12, 0.6, 0.6 + Math.random() * 0.4);
      } else {
        // Purple rays
        color.setHSL(0.8, 0.5, 0.5 + Math.random() * 0.5);
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Varying sizes for more dynamic effect with size multiplier
      sizes[i] = (0.01 + Math.random() * 0.015) * sizeMultiplier;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = this.getMaterialFromPool('lightRays');
    const points = new THREE.Points(geometry, material);
    points.userData = { originalSizes: [...sizes] };
    points.frustumCulled = false; // Disable frustum culling

    this.particleGroups.set('lightRays', points);
    this.scene.add(points);

    return points;
  }

  // Create cosmic energy orbs (new particle type)
  createCosmicOrbs(count = 10, customSpread = null, sizeMultiplier = 1.0) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Use custom spread or default to original values
    const spread = customSpread || this.originalSpreads.cosmicOrbs;

    for (let i = 0; i < count; i++) {
      // Position orbs in background areas
      positions[i * 3] = (Math.random() - 0.5) * spread.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y; // Full height range, including below ground
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;

      // Very slow, mystical movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.003;
      velocities[i * 3 + 1] = Math.random() * 0.002;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;

      // Mystical orb colors
      const color = new THREE.Color();
      const orbType = Math.random();
      if (orbType < 0.3) {
        // Ethereal blue orbs
        color.setHSL(0.6, 0.8, 0.5 + Math.random() * 0.5);
      } else if (orbType < 0.6) {
        // Mystical purple orbs
        color.setHSL(0.8, 0.9, 0.4 + Math.random() * 0.6);
      } else {
        // Celestial white orbs
        color.setHSL(0, 0, 0.8 + Math.random() * 0.2);
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Larger sizes for orbs with size multiplier
      sizes[i] = (0.02 + Math.random() * 0.03) * sizeMultiplier;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = this.getMaterialFromPool('cosmicOrbs');
    const points = new THREE.Points(geometry, material);
    points.userData = { velocities: velocities, originalSizes: [...sizes] };
    points.frustumCulled = false; // Disable frustum culling

    this.particleGroups.set('cosmicOrbs', points);
    this.scene.add(points);

    return points;
  }

  // Optimized update method with reduced frame skipping
  update(delta) {
    this.frameCount++;

    // Only skip updates on every 4th frame to maintain visual quality
    if (this.frameCount % 4 === 0) {
      return;
    }

    this.particleGroups.forEach((group, name) => {
      const positions = group.geometry.attributes.position.array;
      const velocities = group.userData.velocities;
      const originalSizes = group.userData.originalSizes;

      if (name === 'dust' && velocities) {
        // Update dust particle positions with enhanced movement - optimized
        const time = Date.now() * 0.0003;
        const currentSpread = this.originalSpreads.dust;
        let spreadMultiplier;
        if (this.completionProgress <= 0.2) {
          const phase1Progress = this.completionProgress / 0.2;
          spreadMultiplier = 0.4 + (1.0 - 0.4) * Math.pow(phase1Progress, 3);
        } else {
          spreadMultiplier = 1.0;
        }
        const boundaryX = currentSpread.x * spreadMultiplier * 0.5;
        const boundaryY = currentSpread.y * spreadMultiplier * 0.5;
        const boundaryZ = currentSpread.z * spreadMultiplier * 0.5;
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Wrap around boundaries based on current spread
          if (positions[i] > boundaryX) positions[i] = -boundaryX;
          else if (positions[i] < -boundaryX) positions[i] = boundaryX;
          if (positions[i + 1] > boundaryY) positions[i + 1] = -boundaryY;
          else if (positions[i + 1] < -boundaryY) positions[i + 1] = boundaryY;
          if (positions[i + 2] > boundaryZ) positions[i + 2] = -boundaryZ;
          else if (positions[i + 2] < -boundaryZ) positions[i + 2] = boundaryZ;
        }

        // Subtle size pulsing for dust - update more particles
        const sizes = group.geometry.attributes.size.array;
        for (let i = 0; i < sizes.length; i += 1) { // Update every particle
          const pulse = Math.sin(time + i * 0.1) * 0.2 + 0.8;
          sizes[i] = originalSizes[i] * pulse;
        }
        group.geometry.attributes.size.needsUpdate = true;
      } else if (name === 'sparkles' && velocities) {
        // Update sparkle positions with enhanced twinkling effect - optimized
        const time = Date.now() * 0.002;
        const currentSpread = this.originalSpreads.sparkles;
        let spreadMultiplier;
        if (this.completionProgress <= 0.2) {
          const phase1Progress = this.completionProgress / 0.2;
          spreadMultiplier = 0.4 + (1.0 - 0.4) * Math.pow(phase1Progress, 3);
        } else {
          spreadMultiplier = 1.0;
        }
        const boundaryX = currentSpread.x * spreadMultiplier * 0.5;
        const boundaryY = currentSpread.y * spreadMultiplier * 0.5;
        const boundaryZ = currentSpread.z * spreadMultiplier * 0.5;
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Wrap around boundaries based on current spread
          if (positions[i] > boundaryX) positions[i] = -boundaryX;
          else if (positions[i] < -boundaryX) positions[i] = boundaryX;
          if (positions[i + 1] > boundaryY) positions[i + 1] = -boundaryY;
          else if (positions[i + 1] < -boundaryY) positions[i + 1] = boundaryY;
          if (positions[i + 2] > boundaryZ) positions[i + 2] = -boundaryZ;
          else if (positions[i + 2] < -boundaryZ) positions[i + 2] = boundaryZ;
        }

        // Enhanced twinkling effect - update more particles
        const sizes = group.geometry.attributes.size.array;
        for (let i = 0; i < sizes.length; i += 1) { // Update every particle
          const twinkle = Math.sin(time * 4 + i * 0.5) * 0.5 + 0.5;
          const slowPulse = Math.sin(time * 0.5 + i * 0.1) * 0.3 + 0.7;
          sizes[i] = originalSizes[i] * (0.3 + twinkle * 0.7) * slowPulse;
        }
        group.geometry.attributes.size.needsUpdate = true;
      } else if (name === 'lightRays' && originalSizes) {
        // Enhanced movement for light rays - optimized
        const time = Date.now() * 0.0008;
        const sizes = group.geometry.attributes.size.array;
        for (let i = 0; i < sizes.length; i += 1) { // Update every particle
          const pulse = Math.sin(time + i * 0.2) * 0.4 + 0.6;
          const slowPulse = Math.sin(time * 0.3 + i * 0.1) * 0.2 + 0.8;
          sizes[i] = originalSizes[i] * pulse * slowPulse;
        }
        group.geometry.attributes.size.needsUpdate = true;
      } else if (name === 'cosmicOrbs' && velocities) {
        // Update cosmic orb positions with mystical movement - optimized
        const time = Date.now() * 0.001;
        const currentSpread = this.originalSpreads.cosmicOrbs;
        let spreadMultiplier;
        if (this.completionProgress <= 0.2) {
          const phase1Progress = this.completionProgress / 0.2;
          spreadMultiplier = 0.4 + (1.0 - 0.4) * Math.pow(phase1Progress, 3);
        } else {
          spreadMultiplier = 1.0;
        }
        const boundaryX = currentSpread.x * spreadMultiplier * 0.5;
        const boundaryY = currentSpread.y * spreadMultiplier * 0.5;
        const boundaryZ = currentSpread.z * spreadMultiplier * 0.5;
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Wrap around boundaries based on current spread
          if (positions[i] > boundaryX) positions[i] = -boundaryX;
          else if (positions[i] < -boundaryX) positions[i] = boundaryX;
          if (positions[i + 1] > boundaryY) positions[i + 1] = -boundaryY;
          else if (positions[i + 1] < -boundaryY) positions[i + 1] = boundaryY;
          if (positions[i + 2] > boundaryZ) positions[i + 2] = -boundaryZ;
          else if (positions[i + 2] < -boundaryZ) positions[i + 2] = boundaryZ;
        }

        // Mystical orb pulsing - update every particle
        const sizes = group.geometry.attributes.size.array;
        for (let i = 0; i < sizes.length; i += 1) { // Update every particle
          const pulse = Math.sin(time * 2 + i * 0.3) * 0.3 + 0.7;
          const slowPulse = Math.sin(time * 0.5 + i * 0.1) * 0.2 + 0.8;
          sizes[i] = originalSizes[i] * pulse * slowPulse;
        }
        group.geometry.attributes.size.needsUpdate = true;
      }

      group.geometry.attributes.position.needsUpdate = true;
    });
  }

  // Update particle spread and count based on completion progress
  updateParticleSpread(completionProgress) {
    this.completionProgress = completionProgress;
    
    // Two-phase progression:
    // Phase 1 (0-1 puzzles): Particle count, spread, and size grow cubically from 0x to 1.0x
    // Phase 2 (2-4 puzzles): Particle count, spread, and size stay at 1.0x
    let spreadMultiplier, countMultiplier, sizeMultiplier;
    
    if (completionProgress <= 0.2) { // First 1 puzzle (0.2 = 1/5)
      // Phase 1: Particle count, spread, and size growth
      const phase1Progress = completionProgress / 0.2; // 0 to 1
      const minMultiplier = 0.0; // Start with 0 particles
      const maxMultiplier = 1.0;
      const cubicProgress = Math.pow(phase1Progress, 3);
      spreadMultiplier = minMultiplier + (maxMultiplier - minMultiplier) * cubicProgress;
      countMultiplier = minMultiplier + (maxMultiplier - minMultiplier) * cubicProgress;
      sizeMultiplier = 0.3 + (maxMultiplier - 0.3) * cubicProgress; // Size grows from 0.3x to 1.0x
    } else {
      // Phase 2: Particle count, spread, and size stay at maximum
      spreadMultiplier = 1.0;
      countMultiplier = 1.0;
      sizeMultiplier = 1.0;
    }
    
    this.particleGroups.forEach((group, name) => {
      if (this.originalSpreads[name]) {
        const originalSpread = this.originalSpreads[name];
        const newSpread = {
          x: originalSpread.x * spreadMultiplier,
          y: originalSpread.y * spreadMultiplier,
          z: originalSpread.z * spreadMultiplier
        };
        
        // Update particle positions to new spread
        this.updateParticlePositions(group, newSpread);
        
        // Update particle count if needed
        if (this.originalCounts[name]) {
          const newCount = Math.floor(this.originalCounts[name] * countMultiplier);
          this.updateParticleCount(group, name, newCount, newSpread, sizeMultiplier);
        }
        
        // Debug logging removed for cleaner console
      }
    });
  }
  
  // Update particle positions to new spread range
  updateParticlePositions(group, newSpread) {
    const positions = group.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Redistribute particles within the new spread range
      positions[i] = (Math.random() - 0.5) * newSpread.x; // X
      positions[i + 1] = Math.random() * newSpread.y; // Y
      positions[i + 2] = (Math.random() - 0.5) * newSpread.z; // Z
    }
    
    group.geometry.attributes.position.needsUpdate = true;
  }
  
  // Update particle count by recreating the particle group
  updateParticleCount(group, name, newCount, newSpread, sizeMultiplier) {
    const currentCount = group.geometry.attributes.position.count;
    
    // Only update if the count has changed significantly (more than 10% difference)
    if (Math.abs(newCount - currentCount) / currentCount > 0.1) {
      // Remove the old group
      this.scene.remove(group);
      this.particleGroups.delete(name);
      
      // Recreate the particle group with new count
      switch (name) {
        case 'dust':
          this.createDustParticles(newCount, newSpread, sizeMultiplier);
          break;
        case 'sparkles':
          this.createSparkles(newCount, newSpread, sizeMultiplier);
          break;
        case 'lightRays':
          this.createLightRays(newCount, newSpread, sizeMultiplier);
          break;
        case 'cosmicOrbs':
          this.createCosmicOrbs(newCount, newSpread, sizeMultiplier);
          break;
      }
    }
  }

  // Get current particle spread, count, and size information for debugging
  getCurrentSpreadInfo() {
    let spreadMultiplier, countMultiplier, sizeMultiplier;
    if (this.completionProgress <= 0.2) {
      const phase1Progress = this.completionProgress / 0.2;
      const cubicProgress = Math.pow(phase1Progress, 3);
      spreadMultiplier = 0.0 + (1.0 - 0.0) * cubicProgress;
      countMultiplier = 0.0 + (1.0 - 0.0) * cubicProgress;
      sizeMultiplier = 0.3 + (1.0 - 0.3) * cubicProgress;
    } else {
      spreadMultiplier = 1.0;
      countMultiplier = 1.0;
      sizeMultiplier = 1.0;
    }
    
    const info = {
      completionProgress: this.completionProgress,
      spreadMultiplier: spreadMultiplier,
      countMultiplier: countMultiplier,
      sizeMultiplier: sizeMultiplier,
      particleTypes: {}
    };
    
    Object.keys(this.originalSpreads).forEach(name => {
      const original = this.originalSpreads[name];
      const originalCount = this.originalCounts[name];
      info.particleTypes[name] = {
        original: {
          spread: original,
          count: originalCount
        },
        current: {
          spread: {
            x: original.x * spreadMultiplier,
            y: original.y * spreadMultiplier,
            z: original.z * spreadMultiplier
          },
          count: Math.floor(originalCount * countMultiplier),
          size: sizeMultiplier
        }
      };
    });
    
    return info;
  }

  // Create all particle effects
  createAllParticles() {
    this.createDustParticles(100); // Enhanced cosmic dust
    this.createSparkles(50); // Enhanced magical sparkles
    this.createLightRays(15); // Enhanced light rays
    this.createCosmicOrbs(10); // New mystical orbs
  }


}
