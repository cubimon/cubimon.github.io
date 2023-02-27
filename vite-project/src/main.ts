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

renderer.setClearColor(0xeeeeee);
renderer.setPixelRatio(window.devicePixelRatio);
// renderer.setSize(window.innerWidth, window.innerHeight);
// camera.position.setZ(30);

const loader = new GLTFLoader();
let camera: Camera = new PerspectiveCamera();

loader.load(
  //"PigeonPark_Scene_Komplet.glb",
  "PigeonPark_Scene_5- 27-2_embedded_unitless.gltf",
  function (gltf: GLTF) {
    scene.add(gltf.scene);
    //const light = new THREE.AmbientLight( 0x404040 ); // soft white light
    //scene.add( light );
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
    console.log(camera);
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
  //   // update the picking ray with the camera and pointer position
  //   raycaster.setFromCamera(pointer, camera);

  //   // calculate objects intersecting the picking ray
  //   const intersects = raycaster.intersectObjects(scene.children);

  //   console.log(intersects);
  //   console.log(scene);
  //   const sceneGroup = scene.children[0];
  //   console.log(sceneGroup);

  //   // for (let o of sceneGroup.children) {
  //   //   console.log(o);
  //   //   if ("material" in o) {
  //   //     o.material.color.set(0xffffff);
  //   //   }
  //   // }
  //   // for (let i = 0; i < intersects.length; i++) {
  //   //   intersects[i].object.material.color.set(0xff0000);
  //   // }

  resizeCanvas();
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}

// function onPointerMove(event) {
//   // calculate pointer position in normalized device coordinates
//   // (-1 to +1) for both components

//   pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
//   pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
//   // console.log("pointer move")
// }

function click(event: MouseEvent) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  for (const intersect of intersects) {
    alert(`clicked on ${intersect.object.name}`);
  }

  renderer.render(scene, camera);
}

// window.addEventListener("pointermove", onPointerMove);
window.addEventListener("click", click);

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  // canvas.width = width;
  // canvas.height = height;
  renderer.setSize(width, height, false);
  if (camera instanceof PerspectiveCamera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  renderer.render(scene, camera);
}
window.addEventListener("resize", resizeCanvas, false);
