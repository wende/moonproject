import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.particleGroups = new Map();
    
    // Performance optimization: Add frame skipping - less aggressive
    this.frameCount = 0;
    this.updateInterval = 1; // Update every frame (removed frame skipping)
  }

  // Create floating dust particles (background only)
  createDustParticles(count = 150) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random positions in background areas only
      positions[i * 3] = (Math.random() - 0.5) * 30; // Wider spread
      positions[i * 3 + 1] = Math.random() * 10; // Various heights, not just high up
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30; // Deeper background

      // Reduced velocities for subtler movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.006;
      velocities[i * 3 + 1] = Math.random() * 0.003;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.006;

      // More varied colors - cosmic dust
      const color = new THREE.Color();
      const colorType = Math.random();
      if (colorType < 0.4) {
        // Blue cosmic dust
        color.setHSL(0.6, 0.2, 0.7 + Math.random() * 0.3);
      } else if (colorType < 0.7) {
        // Purple cosmic dust
        color.setHSL(0.8, 0.3, 0.6 + Math.random() * 0.4);
      } else {
        // Golden cosmic dust
        color.setHSL(0.12, 0.4, 0.6 + Math.random() * 0.4);
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Varying sizes
      sizes[i] = 0.01 + Math.random() * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { velocities: velocities, originalSizes: [...sizes] };
    points.frustumCulled = false; // Disable frustum culling
    
    this.particleGroups.set('dust', points);
    this.scene.add(points);
    
    return points;
  }

  // Create magical sparkles (background only)
  createSparkles(count = 80) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random positions in background areas only
      positions[i * 3] = (Math.random() - 0.5) * 25; // Wider spread
      positions[i * 3 + 1] = Math.random() * 8; // Various heights, not just high up
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25; // Deeper background

      // Reduced velocities for subtler movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = Math.random() * 0.006;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      // More varied sparkle colors - magical spectrum
      const color = new THREE.Color();
      const sparkleType = Math.random();
      if (sparkleType < 0.3) {
        // Golden sparkles
        color.setHSL(0.12 + Math.random() * 0.05, 0.9, 0.6 + Math.random() * 0.4);
      } else if (sparkleType < 0.6) {
        // Silver sparkles
        color.setHSL(0.6, 0.1, 0.8 + Math.random() * 0.2);
      } else if (sparkleType < 0.8) {
        // Purple sparkles
        color.setHSL(0.8, 0.7, 0.5 + Math.random() * 0.5);
      } else {
        // Rainbow sparkles
        color.setHSL(Math.random(), 0.8, 0.6 + Math.random() * 0.4);
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Varying sizes for more dynamic effect
      sizes[i] = 0.003 + Math.random() * 0.005;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { velocities: velocities, originalSizes: [...sizes] };
    points.frustumCulled = false; // Disable frustum culling
    
    this.particleGroups.set('sparkles', points);
    this.scene.add(points);
    
    return points;
  }

  // Create ambient light rays (background only)
  createLightRays(count = 25) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Position rays in background areas only
      positions[i * 3] = (Math.random() - 0.5) * 22; // Wider spread
      positions[i * 3 + 1] = 3 + Math.random() * 10; // Various heights in background
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22; // Deeper background

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

      // Varying sizes for more dynamic effect
      sizes[i] = 0.01 + Math.random() * 0.015;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { originalSizes: [...sizes] };
    points.frustumCulled = false; // Disable frustum culling
    
    this.particleGroups.set('lightRays', points);
    this.scene.add(points);
    
    return points;
  }

  // Create cosmic energy orbs (new particle type)
  createCosmicOrbs(count = 15) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Position orbs in background areas
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = 2 + Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

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

      // Larger sizes for orbs
      sizes[i] = 0.02 + Math.random() * 0.03;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

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
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Wrap around boundaries (keep in background) - simplified checks
          if (positions[i] > 15) positions[i] = -15;
          else if (positions[i] < -15) positions[i] = 15;
          if (positions[i + 1] > 10) positions[i + 1] = 0;
          else if (positions[i + 1] < 0) positions[i + 1] = 10;
          if (positions[i + 2] > 15) positions[i + 2] = -15;
          else if (positions[i + 2] < -15) positions[i + 2] = 15;
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
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Wrap around boundaries (keep in background) - simplified checks
          if (positions[i] > 12.5) positions[i] = -12.5;
          else if (positions[i] < -12.5) positions[i] = 12.5;
          if (positions[i + 1] > 8) positions[i + 1] = 0;
          else if (positions[i + 1] < 0) positions[i + 1] = 8;
          if (positions[i + 2] > 12.5) positions[i + 2] = -12.5;
          else if (positions[i + 2] < -12.5) positions[i + 2] = 12.5;
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
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Wrap around boundaries - simplified checks
          if (positions[i] > 10) positions[i] = -10;
          else if (positions[i] < -10) positions[i] = 10;
          if (positions[i + 1] > 10) positions[i + 1] = 2;
          else if (positions[i + 1] < 2) positions[i + 1] = 10;
          if (positions[i + 2] > 10) positions[i + 2] = -10;
          else if (positions[i + 2] < -10) positions[i + 2] = 10;
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

  // Create all particle effects
  createAllParticles() {
    this.createDustParticles(150); // Enhanced cosmic dust
    this.createSparkles(80); // Enhanced magical sparkles
    this.createLightRays(25); // Enhanced light rays
    this.createCosmicOrbs(15); // New mystical orbs
  }


}
