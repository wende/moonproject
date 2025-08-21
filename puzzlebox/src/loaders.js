import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export function loadGLTFModel(modelFilePath, scene, mixer) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      modelFilePath,
      (gltf) => {
        scene.add(gltf.scene);

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
