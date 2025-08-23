import * as THREE from 'three';

// Enhanced material system with PBR materials
export class MaterialManager {
  constructor() {
    this.materials = new Map();
    this.textureLoader = new THREE.TextureLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();

    // Performance optimization: Track animated materials separately - less aggressive
    this.animatedMaterials = new Set();
    this.frameCount = 0;
    this.updateInterval = 2; // Update every 2nd frame instead of 3rd

    // Initialize default materials
    this.initializeDefaultMaterials();
  }

  initializeDefaultMaterials() {
    // Enhanced metal material
    this.materials.set('enhancedMetal', new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.7,
      roughness: 0.3,
      envMapIntensity: 0.3,
      clearcoat: 0.1,
      clearcoatRoughness: 0.3
    }));

    // Enhanced wood material
    this.materials.set('enhancedWood', new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      metalness: 0.0,
      roughness: 0.8,
      envMapIntensity: 0.1
    }));

    // Glowing material for interactive elements
    this.materials.set('glowing', new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      metalness: 0.1,
      roughness: 0.2,
      emissive: 0x4a90e2,
      emissiveIntensity: 0.3,
      envMapIntensity: 0.1
    }));

    // Glass material
    this.materials.set('glass', new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.7,
      thickness: 0.5,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.2
    }));

    // Ceramic material
    this.materials.set('ceramic', new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,
      metalness: 0.0,
      roughness: 0.3,
      clearcoat: 0.2,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.1
    }));

    // Brass material
    this.materials.set('brass', new THREE.MeshStandardMaterial({
      color: 0xb5a642,
      metalness: 0.6,
      roughness: 0.4,
      envMapIntensity: 0.4
    }));

    // Stone material
    this.materials.set('stone', new THREE.MeshStandardMaterial({
      color: 0x696969,
      metalness: 0.0,
      roughness: 0.9,
      envMapIntensity: 0.05
    }));
  }

  // Create a material with custom properties
  createMaterial(options = {}) {
    const {
      color = 0x888888,
      metalness = 0.5,
      roughness = 0.5,
      emissive = 0x000000,
      emissiveIntensity = 0.0,
      transmission = 0.0,
      clearcoat = 0.0,
      clearcoatRoughness = 0.0,
      envMapIntensity = 1.0
    } = options;

    return new THREE.MeshPhysicalMaterial({
      color,
      metalness,
      roughness,
      emissive,
      emissiveIntensity,
      transmission,
      clearcoat,
      clearcoatRoughness,
      envMapIntensity
    });
  }

  // Get a material by name
  getMaterial(name) {
    return this.materials.get(name);
  }

  // Apply enhanced materials to a mesh or group
  applyEnhancedMaterials(object, materialName) {
    if (object.isMesh) {
      const material = this.getMaterial(materialName);
      if (material) {
        object.material = material;
        object.castShadow = true;
        object.receiveShadow = true;
      }
    } else if (object.children) {
      object.children.forEach(child => {
        this.applyEnhancedMaterials(child, materialName);
      });
    }
  }

  // Create animated glowing material - optimized
  createAnimatedGlowingMaterial(baseColor = 0x4a90e2, pulseSpeed = 2.0) {
    const material = this.createMaterial({
      color: baseColor,
      metalness: 0.1,
      roughness: 0.2,
      emissive: baseColor,
      emissiveIntensity: 0.3
    });

    // Add animation capability
    material.userData = {
      baseColor: new THREE.Color(baseColor),
      pulseSpeed: pulseSpeed,
      time: 0
    };

    // Track this material for animation updates
    this.animatedMaterials.add(material);

    return material;
  }

  // Update animated materials - optimized with reduced frame skipping
  updateAnimatedMaterials(deltaTime) {
    this.frameCount++;

    // Skip updates on every 3rd frame instead of every 3rd frame
    if (this.frameCount % 3 === 0) {
      return;
    }

    // Only update materials that are actually animated
    this.animatedMaterials.forEach(material => {
      if (material.userData && material.userData.pulseSpeed) {
        material.userData.time += deltaTime * material.userData.pulseSpeed;
        const pulse = Math.sin(material.userData.time) * 0.5 + 0.5;
        material.emissiveIntensity = 0.2 + pulse * 0.3;
      }
    });
  }


}

// Global material manager instance
export const materialManager = new MaterialManager();

// Function to enhance model materials
export function enhanceModelMaterials(scene) {
  scene.traverse((object) => {
    if (object.isMesh) {
      // Enable shadows for all meshes
      object.castShadow = true;
      object.receiveShadow = true;

      // Apply specific enhanced materials for certain objects (excluding brass and buttons)
      if (object.name.toLowerCase().includes('metal') &&
          !object.name.toLowerCase().includes('brass') &&
          !object.name.toLowerCase().includes('button')) {
        materialManager.applyEnhancedMaterials(object, 'enhancedMetal');
      } else if (object.name.toLowerCase().includes('wood') &&
                 !object.name.toLowerCase().includes('brass')) {
        materialManager.applyEnhancedMaterials(object, 'enhancedWood');
      } else if (object.name.toLowerCase().includes('glass') &&
                 !object.name.toLowerCase().includes('brass')) {
        materialManager.applyEnhancedMaterials(object, 'glass');
      } else if (object.name.toLowerCase().includes('light') &&
                 !object.name.toLowerCase().includes('brass')) {
        materialManager.applyEnhancedMaterials(object, 'glowing');
      }
      // Note: Brass and buttons keep their original materials completely untouched
    }
  });
}
