import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Function to find and disable embedded lights in the model
function disableEmbeddedLights(scene) {
  let lightCount = 0;
  
  scene.traverse((object) => {
    if (object.isLight) {
      console.log(`Found embedded light: ${object.name || 'unnamed'} (${object.type})`);
      object.intensity = 0; // Disable the light by setting intensity to 0
      lightCount++;
    }
  });
  
  if (lightCount > 0) {
    console.log(`Disabled ${lightCount} embedded lights in the model`);
  } else {
    console.log('No embedded lights found in the model');
  }
}

export function loadGLTFModel(modelFilePath, scene, mixer) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      modelFilePath,
      (gltf) => {
        scene.add(gltf.scene);

        // Disable any embedded lights in the model
        //disableEmbeddedLights(gltf.scene);

        // create actions from animation
        const actions = {};
        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          actions[clip.name] = action;
        })

        resolve({ gltf, actions });
      },
      undefined,
      (error) => reject(error)
    );
  });
}
