import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Memory optimization: Add texture compression and geometry optimization
export function loadGLTFModel(modelFilePath, scene, mixer) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    
    // Memory optimization: Configure loader for better memory usage
    loader.setKTX2Loader(null); // Disable KTX2 if not needed
    loader.setMeshoptDecoder(null); // Disable meshopt if not needed
    
    loader.load(
      modelFilePath,
      (gltf) => {
        // Memory optimization: Optimize the loaded model
        optimizeGLTFModel(gltf);
        
        scene.add(gltf.scene);

        // create actions from animation
        const actions = {};
        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          actions[clip.name] = action;
        });

        resolve({ gltf, actions });
      },
      undefined,
      (error) => reject(error)
    );
  });
}

// Memory optimization: Optimize GLTF model for better memory usage
function optimizeGLTFModel(gltf) {
  gltf.scene.traverse((object) => {
    if (object.isMesh) {
      // Memory optimization: Optimize geometry
      if (object.geometry) {
        // Optimize buffer attributes - disable unnecessary updates
        if (object.geometry.attributes.position) {
          object.geometry.attributes.position.needsUpdate = false;
        }
        if (object.geometry.attributes.normal) {
          object.geometry.attributes.normal.needsUpdate = false;
        }
        if (object.geometry.attributes.uv) {
          object.geometry.attributes.uv.needsUpdate = false;
        }
        
        // Memory optimization: Dispose of unused attributes
        if (object.geometry.attributes.tangent && !object.material.normalMap) {
          object.geometry.deleteAttribute('tangent');
        }
      }
      
      // Memory optimization: Optimize materials
      if (object.material) {
        // Reduce texture quality for better memory usage
        if (object.material.map) {
          object.material.map.generateMipmaps = false;
          object.material.map.minFilter = THREE.LinearFilter;
        }
        if (object.material.normalMap) {
          object.material.normalMap.generateMipmaps = false;
        }
        if (object.material.roughnessMap) {
          object.material.roughnessMap.generateMipmaps = false;
        }
        if (object.material.metalnessMap) {
          object.material.metalnessMap.generateMipmaps = false;
        }
      }
    }
  });
}
