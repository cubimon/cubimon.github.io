import "./style.css";
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Camera, PerspectiveCamera } from "three";

const scene = new THREE.Scene();
const canvas = document.querySelector<HTMLCanvasElement>("#bg");
if (canvas == null) {
  throw new Error("canvas not found");
}
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.physicallyCorrectLights = true;
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;

const loader = new GLTFLoader();
let camera: Camera = new PerspectiveCamera();

loader.load(
  //"PigeonPark_Scene_Komplet.glb",
  "PigeonPark_Scene_5- 27-2_embedded_unitless.gltf",
  // "assets/PigeonPark_Scene_5- 27-2_embedded_unitless.gltf",
  function (gltf: GLTF) {
    scene.add(gltf.scene);
    console.log(gltf);
    const camQuery = new URLSearchParams(window.location.search).get("cam");
    let index = 0;
    if (camQuery != null) {
      index = parseInt(camQuery);
    }
    if (isNaN(index)) {
      index = 0;
    }
    camera = gltf.cameras[index];
    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function render() {
  resizeCanvas();
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}

function click(event: MouseEvent) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  //for (const intersect of intersects) {
  //  alert(`clicked on ${intersect.object.name}`);
  //}

  renderer.render(scene, camera);
}

window.addEventListener("click", click);

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  if (camera instanceof PerspectiveCamera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  renderer.render(scene, camera);
}
window.addEventListener("resize", resizeCanvas, false);
