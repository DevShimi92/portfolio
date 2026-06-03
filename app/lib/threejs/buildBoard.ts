import * as THREE from 'three';

export function buildBoard(scene: THREE.Scene) {

  const root = new THREE.Group();
  scene.add(root);

  const BOARD_HEIGHT  = 0.10;

  root.add(new THREE.Mesh(
    new THREE.BoxGeometry(100, BOARD_HEIGHT, 100),
    new THREE.MeshStandardMaterial({
      color: 0x04080c, roughness: 0.12, metalness: 0.7,
    })
  ));
}
