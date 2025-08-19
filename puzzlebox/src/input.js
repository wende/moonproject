export function setupInput(raycaster, mouse, camera, puzzleManager, rendererDomElement) {
  window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersected = puzzleManager.puzzles.flatMap(
      puzzle => puzzle.interactiveButtons
    );
    const intersects = raycaster.intersectObjects(intersected);

    // get closest intersecting object
    if (intersects.length > 0) {
      const clickedButton = intersects[0].object;
      puzzleManager.handleClick(clickedButton);
    }
  });

  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersected = puzzleManager.puzzles.flatMap(
      puzzle => puzzle.interactiveButtons
    );
    const intersects = raycaster.intersectObjects(intersected);

    rendererDomElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
  });
}
