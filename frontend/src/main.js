import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const statusEl = document.getElementById("status");
const inputEl = document.getElementById("prompt");
const btnEl = document.getElementById("btn");
const toggleStarsBtn = document.getElementById("toggleStars");

// ✅ Backend auto-detect (works on LAN + works on your PC too)
const BACKEND = `${window.location.protocol}//${window.location.hostname}:3001`;

// ---------- Three.js setup ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color("#000010"); // space-like deep blue-black

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 1.5, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ---------- Lights ----------
const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(3, 5, 2);
scene.add(dir);

const dir2 = new THREE.DirectionalLight(0xffffff, 0.6);
dir2.position.set(-4, 2, -3);
scene.add(dir2);

// ---------- Controls ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ---------- Loader ----------
const loader = new GLTFLoader();

// We store current model so we can remove it
let currentModel = null;

// ---------- Starfield ----------
function createStarfield() {
  const starCount = 4000;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    positions[i3 + 0] = (Math.random() - 0.5) * 300;
    positions[i3 + 1] = (Math.random() - 0.5) * 300;
    positions[i3 + 2] = (Math.random() - 0.5) * 300;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.35,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
  });

  const stars = new THREE.Points(geometry, material);
  return stars;
}

let stars = createStarfield();
let starsEnabled = true;
scene.add(stars);

function updateStarsButton() {
  toggleStarsBtn.textContent = starsEnabled ? "Stars: ON" : "Stars: OFF";
}

toggleStarsBtn.addEventListener("click", () => {
  starsEnabled = !starsEnabled;

  if (starsEnabled) {
    // re-add if missing
    if (!stars) stars = createStarfield();
    scene.add(stars);
  } else {
    // hide (remove from scene)
    if (stars) scene.remove(stars);
  }

  updateStarsButton();
});

updateStarsButton();

// ---------- Fix model scale + camera framing ----------
function normalizeAndFrameModel(model) {
  const box = new THREE.Box3().setFromObject(model);

  if (!isFinite(box.min.x) || !isFinite(box.max.x)) {
    console.warn("Model bounding box invalid.");
    return;
  }

  const size = new THREE.Vector3();
  box.getSize(size);

  const center = new THREE.Vector3();
  box.getCenter(center);

  // Center model at origin
  model.position.sub(center);

  // Scale to consistent size
  const maxAxis = Math.max(size.x, size.y, size.z);
  const targetSize = 2.2;

  if (maxAxis > 0) {
    const scale = targetSize / maxAxis;
    model.scale.setScalar(scale);
  }

  // Recompute after scaling
  const box2 = new THREE.Box3().setFromObject(model);
  const size2 = new THREE.Vector3();
  box2.getSize(size2);

  const center2 = new THREE.Vector3();
  box2.getCenter(center2);

  // Fit camera
  const maxDim = Math.max(size2.x, size2.y, size2.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2));

  cameraZ *= 1.6;

  camera.position.set(center2.x, center2.y + maxDim * 0.15, center2.z + cameraZ);

  camera.near = Math.max(0.01, cameraZ / 100);
  camera.far = cameraZ * 100;
  camera.updateProjectionMatrix();

  controls.target.copy(center2);
  controls.update();
}

// ---------- Load model by prompt ----------
async function loadModelFromPrompt(prompt) {
  statusEl.textContent = "Optimising prompt...";

  const r = await fetch(`${BACKEND}/api/getModel?q=${encodeURIComponent(prompt)}`);

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch model");
  }

  const data = await r.json();

  statusEl.textContent = `Loading: ${data.name}`;
  console.log("Backend response:", data);

  loader.load(
    data.localGltfUrl,
    (gltf) => {
      // Remove previous model
      if (currentModel) scene.remove(currentModel);

      currentModel = gltf.scene;
      scene.add(currentModel);

      normalizeAndFrameModel(currentModel);

      statusEl.textContent = `Generated: ${data.name}`;
    },
    (xhr) => {
      if (xhr.total) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        statusEl.textContent = `Generating... ${pct}%`;
      }
    },
    (err) => {
      console.error(err);
      statusEl.textContent = "Failed to load model.";
    },
  );
}

// ---------- UI Events ----------
btnEl.addEventListener("click", async () => {
  const prompt = inputEl.value.trim();
  if (!prompt) return;

  try {
    await loadModelFromPrompt(prompt);
  } catch (e) {
    statusEl.textContent = e.message;
  }
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnEl.click();
});

// ---------- Animate ----------
function animate() {
  requestAnimationFrame(animate);

  // Only animate stars if enabled AND in scene
  if (starsEnabled && stars) {
    stars.rotation.y += 0.00035;
    stars.rotation.x += 0.0001;

    stars.position.z += 0.02;
    if (stars.position.z > 50) stars.position.z = 0;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

// ---------- Resize ----------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
