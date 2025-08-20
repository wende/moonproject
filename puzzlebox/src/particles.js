import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.particleGroups = new Map();
  }

  // Create floating dust particles (background only)
  createDustParticles(count = 100) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random positions in background areas only
      positions[i * 3] = (Math.random() - 0.5) * 25; // Wider spread
      positions[i * 3 + 1] = Math.random() * 8; // Various heights, not just high up
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25; // Deeper background

      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = Math.random() * 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

      // Subtle colors
      const color = new THREE.Color();
      color.setHSL(0.6, 0.1, 0.8 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.015, // Much smaller size
      vertexColors: true,
      transparent: true,
      opacity: 0.3, // More transparent
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { velocities: velocities };
    
    this.particleGroups.set('dust', points);
    this.scene.add(points);
    
    return points;
  }

  // Create magical sparkles (background only)
  createSparkles(count = 50) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random positions in background areas only
      positions[i * 3] = (Math.random() - 0.5) * 20; // Wider spread
      positions[i * 3 + 1] = Math.random() * 6; // Various heights, not just high up
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // Deeper background

      // Random velocities
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = Math.random() * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      // Sparkle colors (golden/white)
      const color = new THREE.Color();
      color.setHSL(0.12 + Math.random() * 0.05, 0.8, 0.7 + Math.random() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Random sizes (very small)
      sizes[i] = 0.002 + Math.random() * 0.003;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.4, // More transparent
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { velocities: velocities, originalSizes: [...sizes] };
    
    this.particleGroups.set('sparkles', points);
    this.scene.add(points);
    
    return points;
  }

  // Create ambient light rays (background only)
  createLightRays(count = 20) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Position rays in background areas only
      positions[i * 3] = (Math.random() - 0.5) * 18; // Wider spread
      positions[i * 3 + 1] = 3 + Math.random() * 8; // Various heights in background
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18; // Deeper background

      // Soft blue-white colors
      const color = new THREE.Color();
      color.setHSL(0.6, 0.3, 0.8 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Varying sizes (very small)
      sizes[i] = 0.008 + Math.random() * 0.012;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.2, // More transparent for light rays
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { originalSizes: [...sizes] };
    
    this.particleGroups.set('lightRays', points);
    this.scene.add(points);
    
    return points;
  }

  // Update particle animations
  update(deltaTime) {
    this.particleGroups.forEach((group, name) => {
      const positions = group.geometry.attributes.position.array;
      const velocities = group.userData.velocities;
      const originalSizes = group.userData.originalSizes;

      if (name === 'dust' && velocities) {
        // Update dust particle positions
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Wrap around boundaries (keep in background)
          if (positions[i] > 12.5) positions[i] = -12.5;
          if (positions[i] < -12.5) positions[i] = 12.5;
          if (positions[i + 1] > 8) positions[i + 1] = 0;
          if (positions[i + 1] < 0) positions[i + 1] = 8;
          if (positions[i + 2] > 12.5) positions[i + 2] = -12.5;
          if (positions[i + 2] < -12.5) positions[i + 2] = 12.5;
        }
      } else if (name === 'sparkles' && velocities) {
        // Update sparkle positions with twinkling effect
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Wrap around boundaries (keep in background)
          if (positions[i] > 10) positions[i] = -10;
          if (positions[i] < -10) positions[i] = 10;
          if (positions[i + 1] > 6) positions[i + 1] = 0;
          if (positions[i + 1] < 0) positions[i + 1] = 6;
          if (positions[i + 2] > 10) positions[i + 2] = -10;
          if (positions[i + 2] < -10) positions[i + 2] = 10;
        }

        // Twinkling effect
        const sizes = group.geometry.attributes.size.array;
        for (let i = 0; i < sizes.length; i++) {
          const time = Date.now() * 0.001;
          const twinkle = Math.sin(time * 3 + i) * 0.5 + 0.5;
          sizes[i] = originalSizes[i] * (0.5 + twinkle * 0.5);
        }
        group.geometry.attributes.size.needsUpdate = true;
      } else if (name === 'lightRays' && originalSizes) {
        // Subtle movement for light rays
        const sizes = group.geometry.attributes.size.array;
        for (let i = 0; i < sizes.length; i++) {
          const time = Date.now() * 0.0005;
          const pulse = Math.sin(time + i) * 0.3 + 0.7;
          sizes[i] = originalSizes[i] * pulse;
        }
        group.geometry.attributes.size.needsUpdate = true;
      }

      group.geometry.attributes.position.needsUpdate = true;
    });
  }

  // Create all particle effects
  createAllParticles() {
    this.createDustParticles(80); // Slightly more particles
    this.createSparkles(35); // Slightly more particles
    this.createLightRays(15); // Slightly more particles
  }

  // Remove all particles
  removeAllParticles() {
    this.particleGroups.forEach(group => {
      this.scene.remove(group);
      group.geometry.dispose();
      group.material.dispose();
    });
    this.particleGroups.clear();
  }
}
