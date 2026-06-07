import * as THREE from 'three';

export function Renderer(mount: HTMLDivElement, perfLevel: string, onUpdate?: (deltaTime: number) => void) {

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 500);

  // ─────────────────────────────────────────────────────────
  //  RENDERER
  // ─────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  if (perfLevel == "reduced") {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
  }
  else
  {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  renderer.setAnimationLoop( animate );
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000508, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // ─────────────────────────────────────────────────────────
  // Environment Map
  // ─────────────────────────────────────────────────────────
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // Environment minimaliste avec DataTexture 2x1 px (gradient sombre)
  const envData = new Uint8Array([
    5, 18, 30, 255,   // gauche : bleu tres sombre
    10, 28, 45, 255,   // droite : cyan sombre
  ]);

  const envTex = new THREE.DataTexture(envData, 2, 1, THREE.RGBAFormat);
  envTex.needsUpdate = true;

  const envMap = pmrem.fromEquirectangular(envTex).texture;
  scene.environment = envMap;

  // ─────────────────────────────────────────────────────────
  // Eclairage
  // ─────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x05111a, 4));
  const dir = new THREE.DirectionalLight(0x99ddee, 1.8);
  dir.position.set(12, 28, 8);
  scene.add(dir);

  // Direction lumiere en espace camera (approximee depuis la dirLight)
  const lightDirection = dir.position.clone().normalize();

  // ─────────────────────────────────────────────────────────
  // Camera
  // ─────────────────────────────────────────────────────────
  // Etat orbite de la caméra
  const theta  = 0.490, phi = 0.952, radius = 16.13;

  // Point cible (pan translate ce vecteur)
  const target = new THREE.Vector3(-11.99, 1.37, 2.88);

  function applyCamera() {
      // Position spherique autour de target
      camera.position.set(
          target.x + radius * Math.sin(phi) * Math.sin(theta),
          target.y + radius * Math.cos(phi),
          target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);
      }

  applyCamera();


  // ─────────────────────────────────────────────────────────
  //  Resize Camera
  // ─────────────────────────────────────────────────────────
  const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize)



  let lastTime = 0
  const TARGET_FPS = 30
  const FRAME_INTERVAL = 1000 / TARGET_FPS

  const clock = new THREE.Timer()

  function animate(time: number) {
    clock.update(time)
    const deltaTime = clock.getDelta();
    if (perfLevel == "reduced") {
      if (time - lastTime < FRAME_INTERVAL) return
        lastTime = time
    }

    onUpdate?.(deltaTime);
    renderer.render( scene, camera );
  }

  mount.appendChild(renderer.domElement);

  return {
    renderer, scene, camera, lightDirection,
    cleanEventResize: () => window.removeEventListener('resize', onResize)};
}
