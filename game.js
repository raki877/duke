// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// RENDERER (THIS IS WEBGL)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// LIGHTS
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

// GROUND (HILLS)
const groundGeometry = new THREE.PlaneGeometry(500, 50, 300, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// CREATE HILLS
const positions = ground.geometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  positions.setZ(i, Math.sin(x * 0.08) * 3);
}
positions.needsUpdate = true;

// CAR
const car = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 0.6, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
car.position.set(0, 3, 0);
scene.add(car);

// CAMERA POSITION
camera.position.set(6, 5, 10);

// GAME VARIABLES
let speed = 0;
let fuel = 100;
let velocityY = 0;
let distance = 0;
const gravity = -0.06;

// INPUT
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// UI
const fuelUI = document.getElementById("fuel");
const distanceUI = document.getElementById("distance");

// GAME LOOP
function animate() {
  requestAnimationFrame(animate);

  // CONTROLS
  if (keys["ArrowRight"] && fuel > 0) {
    speed += 0.003;
    fuel -= 0.05;
  }
  if (keys["ArrowLeft"]) speed -= 0.002;

  speed *= 0.99;
  car.position.x += speed;
  distance = Math.max(distance, Math.floor(car.position.x));

  // GRAVITY
  velocityY += gravity;
  car.position.y += velocityY;

  // GROUND HEIGHT
  const groundHeight = Math.sin(car.position.x * 0.08) * 3 + 0.5;
  if (car.position.y < groundHeight) {
    car.position.y = groundHeight;
    velocityY = 0;
  }

  // ROTATE CAR BASED ON SLOPE
  const slope = Math.cos(car.position.x * 0.08) * 0.25;
  car.rotation.z = slope;

  // CAMERA FOLLOW
  camera.position.x = car.position.x + 6;
  camera.lookAt(car.position);

  // UI UPDATE
  fuelUI.textContent = Math.max(0, fuel.toFixed(0));
  distanceUI.textContent = distance;

  // GAME OVER
  if (fuel <= 0 && Math.abs(speed) < 0.001) {
    alert("Game Over! Distance: " + distance);
    location.reload();
  }

  renderer.render(scene, camera);
}

animate();

// RESIZE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
