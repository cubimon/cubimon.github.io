import "./style.css";
import {
  AnimationMixer,
  Scene,
  WebGLRenderer,
  Raycaster,
  Vector2,
  SRGBColorSpace,
  LoopOnce,
  AnimationClip,
  AnimationAction,
} from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Camera, PerspectiveCamera } from "three";

const scene = new Scene();
const canvas = document.querySelector<HTMLCanvasElement>("#bg");
if (canvas == null) {
  throw new Error("canvas not found");
}
const renderer = new WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.useLegacyLights = false;
renderer.setClearColor(0xffb598);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = SRGBColorSpace;

const loader = new GLTFLoader();
let camera: Camera = new PerspectiveCamera();
let gltf: GLTF | null = null;

let cameraAnimations: {
  animation: AnimationClip;
  camera: Camera;
}[] = [];
let mixer: AnimationMixer | null = null;
let action: AnimationAction | null = null;

enum CameraState {
  Start,
  Contact,
  Work,
  About,
  Motion,
}

let currentMotion: undefined | [CameraState, CameraState] = undefined;
let currentState: CameraState = CameraState.Start;
let goalState: undefined | CameraState = undefined;

function setGoalState(newGoalState: CameraState) {
  // if (currentState == CameraState.Motion) {
  //   return;
  // }
  goalState = newGoalState;
  updateMotion();
  prevtime = 0;
  window.requestAnimationFrame(render);
}

function motionEnded() {
  if (!currentMotion) {
    return;
  }
  mixer = null;
  action = null;
  currentState = currentMotion[1];
  currentMotion = undefined;
  updateMotion();
}

function updateMotion() {
  if (!goalState) {
    return;
  }
  if (currentState == goalState) {
    return;
  }
  if (currentState == CameraState.Start) {
    setMotion(currentState, goalState);
    return;
  } else if (currentState == CameraState.Motion) {
    if (currentMotion && currentMotion[0] == goalState) {
      setMotion(currentState, goalState);
      return;
    }
  }
  setMotion(currentState, CameraState.Start);
}

function setMotion(from: CameraState, to: CameraState) {
  let index = 0;
  if (from == CameraState.Motion) {
    if (!currentMotion) {
      throw Error("current motion is not defined despite being in motion");
    }
    if (currentMotion[1] == to) {
      return;
    }
    if (action) {
      action.timeScale *= -1;
    }
    currentMotion = [currentMotion[1], to];
  } else if (from == CameraState.Start) {
    if (to == CameraState.Contact) {
      index = 0;
    } else if (to == CameraState.Work) {
      index = 1;
    } else if (to == CameraState.About) {
      index = 2;
    } else {
      throw Error(`Unknown to state ${to}`);
    }
    camera = cameraAnimations[index]?.camera;
    updateCamera();
    mixer = new AnimationMixer(camera);
    action = mixer.clipAction(cameraAnimations[index]?.animation);
    action.setLoop(LoopOnce, 0);
    mixer.timeScale = 0.5;
    action.play();
    action.clampWhenFinished = true;
    mixer.update(0);
    mixer.addEventListener("finished", motionEnded);
    currentMotion = [from, to];
    currentState = CameraState.Motion;
  } else if (to == CameraState.Start) {
    if (from == CameraState.Contact) {
      index = 0;
    } else if (from == CameraState.Work) {
      index = 1;
    } else if (from == CameraState.About) {
      index = 2;
    } else {
      throw Error(`Unknown from state ${from}`);
    }
    camera = cameraAnimations[index]?.camera;
    updateCamera();
    mixer = new AnimationMixer(camera);
    let oldAction = action;
    action = mixer.clipAction(cameraAnimations[index]?.animation);
    action.time = action.getClip().duration;
    if (oldAction) {
      action.time -= oldAction.time;
    }
    action.setLoop(LoopOnce, 0);
    action.timeScale = -0.5;
    action.clampWhenFinished = true;
    oldAction?.stop();
    action.play();
    mixer.addEventListener("finished", motionEnded);
    currentMotion = [from, to];
    currentState = CameraState.Motion;
  } else {
    throw Error("from or to must be Start");
  }
}

loader.load(
  //"PigeonPark_Scene_Komplet.glb",
  // "PigeonPark_Scene_5- 27-2_embedded_unitless.gltf",
  "assets/PigeonPark_Scene_5_25.7.gltf",
  // "PigeonPark_Scene_5_20-3.gltf",
  // "assets/PigeonPark_Scene_5_20-3.gltf",
  // "assets/PigeonPark_Scene_5- 27-2_embedded_unitless.gltf",
  function (loadedGltf: GLTF) {
    gltf = loadedGltf;
    scene.add(gltf.scene);
    console.log(gltf);
    let getCamera = (name: string): Camera => {
      const result = gltf?.cameras.find((camera) => camera.name == name);
      if (!result) {
        throw Error(`Camera ${name} not found`);
      }
      return result;
    };
    let getAnimation = (name: string): AnimationClip => {
      const result = gltf?.animations.find(
        (animation) => animation.name == name
      );
      if (!result) {
        throw Error(`Animation ${name} not found`);
      }
      return result;
    };
    const cameraAnimationNames = [
      // [animation name, camera name]
      ["Position Main-ContactAction.002", "Position_Main-Contact"],
      ["Position Main-ContactAction.003", "Position_Main-Work"],
      ["Position Main-ContactAction.004", "Position_Main-About"],
    ];
    cameraAnimations = cameraAnimationNames.map((cameraAnimationName) => {
      return {
        animation: getAnimation(cameraAnimationName[0]),
        camera: getCamera(cameraAnimationName[1]),
      };
    });
    const camQuery = new URLSearchParams(window.location.search).get("cam");
    let index = 0;
    if (camQuery != null) {
      index = parseInt(camQuery);
    }
    if (isNaN(index)) {
      index = 0;
    }
    for (const child of scene.children[0].children) {
      if ("isPointLight" in child && child.isPointLight) {
        if ("intensity" in child && typeof child.intensity == "number") {
          child.intensity *= 0.3;
        }
      }
    }
    camera = gltf.cameras[index];
    resizeCanvas();
    window.requestAnimationFrame(render);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

const raycaster = new Raycaster();
const pointer = new Vector2();

let prevtime = 0;
function render(time: number) {
  if (prevtime == 0) {
    prevtime = time;
  }
  renderer.render(scene, camera);
  mixer?.update((time - prevtime) / 1000);
  if (currentState == CameraState.Motion) {
    window.requestAnimationFrame(render);
  }
  prevtime = time;
}

function click(event: MouseEvent) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  for (const intersect of intersects) {
    if (intersect.object.name.match(/Cylinder013/g)) {
      alert("Briefkasten");
    } else if (intersect.object.name.match(/Cube002/g)) {
      alert("Bank");
    } else if (intersect.object.name.match(/Vogeltränke.*/g)) {
      alert("Vogeltränke");
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener("click", click);

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  updateCamera();
}
function updateCamera() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (camera instanceof PerspectiveCamera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}
window.addEventListener(
  "resize",
  () => {
    resizeCanvas();
    renderer.render(scene, camera);
  },
  false
);

window.addEventListener("load", () => {
  const teamPopup = document.querySelector(".team-popup");
  const workPopup = document.querySelector(".work-popup");
  const contactPopup = document.querySelector(".contact-popup");
  const teamButton = document.querySelector(".team-button");
  const workButton = document.querySelector(".work-button");
  const contactButton = document.querySelector(".contact-button");
  document.querySelector(".team-button")?.addEventListener("click", () => {
    teamPopup?.classList.remove("hidden");
    workPopup?.classList.add("hidden");
    contactPopup?.classList.add("hidden");
    teamButton?.classList.add("selected-button");
    workButton?.classList.remove("selected-button");
    contactButton?.classList.remove("selected-button");
    setGoalState(CameraState.About);
  });
  document.querySelector(".work-button")?.addEventListener("click", () => {
    teamPopup?.classList.add("hidden");
    workPopup?.classList.remove("hidden");
    contactPopup?.classList.add("hidden");
    teamButton?.classList.remove("selected-button");
    workButton?.classList.add("selected-button");
    contactButton?.classList.remove("selected-button");
    setGoalState(CameraState.Work);
  });
  document.querySelector(".contact-button")?.addEventListener("click", () => {
    teamPopup?.classList.add("hidden");
    workPopup?.classList.add("hidden");
    contactPopup?.classList.remove("hidden");
    teamButton?.classList.remove("selected-button");
    workButton?.classList.remove("selected-button");
    contactButton?.classList.add("selected-button");
    setGoalState(CameraState.Contact);
  });
});
