import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import './style.css'
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import getStarfield from './getStarts';
import data from './data'

// const renderer = new THREE.WebGLRenderer({ antialias: true });
const canvas = document.getElementById('canvas')
const popupElement = document.getElementById('popup');
const popupTextElement = document.getElementById('popupText');
const closeButton = document.getElementById('closeButton');
const toggleButton = document.getElementById('toggleButton');
let autoRotateEnabled = false;
// renderer.outputColorSpace = THREE.SRGBColorSpace;


let sizes = {
  height: window.innerHeight,
  width: window.innerWidth
}

// Set up the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setClearColor(0x000000)
renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.enabled = true; // Enable shadow mapping
// document.body.appendChild(renderer.domElement);


const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Add a spotlight to create shadows and highlight the car
const spotlight = new THREE.SpotLight(0xffffff, 1);
spotlight.position.set(0, 10, 0);
spotlight.castShadow = true;
scene.add(spotlight);

// Create a grid helper to serve as the ground surface
const gridHelper = new THREE.GridHelper(15, 15, 0xffffff, 0xffffff);
scene.add(gridHelper);

// Create a plane geometry
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#000000',
  transparent: true,
  opacity: 0.5,
  roughness: 0.1,
  metalness: 0.9,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  transmission: 0.9,
  ior: 1.5
});

// Create a plane geometry
const planeGeometry = new THREE.PlaneGeometry(15, 15);

// Create a mesh using the plane geometry and glass material
const plane = new THREE.Mesh(planeGeometry, glassMaterial);
plane.rotation.x = -Math.PI / 2; // Rotate the plane to lay flat on the grid
scene.add(plane);



const star = getStarfield();
scene.add(star);

const hotspots = [];
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, -1, 0.7);
// h, v,topdown

const directionalLightRight = new THREE.DirectionalLight(0xffffff, 1);
directionalLightRight.position.set(1, -1, -5);

// Optionally, you can set the light's target to your car model to control its direction
// directionalLight.target = model;

// Add light to scene
scene.add(directionalLight);

const loader = new GLTFLoader().setPath('/assets/models/dodge_charger/')
loader.load('scene.gltf', (gltf) => {
  const model = gltf.scene;
  scene.add(model);
  model.position.y = 0.1;

  camera.position.set(0, 7, 15);
  camera.lookAt(0, 0, 0);

  hotspots.push(createHotspot(new THREE.Vector3(1.5, 0.5, 1.2), '1', new THREE.Vector3(1, 0, 0)));
  hotspots.push(createHotspot(new THREE.Vector3(-2, 1.3, -0), '2', new THREE.Vector3(1, 0, 0)));
  hotspots.push(createHotspot(new THREE.Vector3(2.5, 1.3, -0), '3', new THREE.Vector3(1, 0, 0)));

  console.log('Hotspots array:', hotspots);
  // createHotspot(new THREE.Vector3(1.5, 0.5, 1.2), '1', new THREE.Vector3(1, 0, 0),'Information for hotspot 1');
  // createHotspot(new THREE.Vector3(-2, 1.3, -0), '2', new THREE.Vector3(1, 0, 0),'Information for hotspot 2');
  // createHotspot(new THREE.Vector3(2.5, 1.3, -0), '3', new THREE.Vector3(1, 0, 0),'Information for hotspot 3');
});


function createHotspot(position, number, tiltDirection, text) {
  const hotspotCanvas = document.createElement('canvas');
  const rippleCanvas = document.createElement('canvas');
  const size = 64; // Size of the canvas
  hotspotCanvas.width = size;
  hotspotCanvas.height = size;
  rippleCanvas.width = size;
  rippleCanvas.height = size;
  const hotspotCtx = hotspotCanvas.getContext('2d');
  const rippleCtx = rippleCanvas.getContext('2d');

  const hotspotTexture = new THREE.CanvasTexture(hotspotCanvas);
  const hotspotMaterial = new THREE.SpriteMaterial({ map: hotspotTexture });
  const hotspotSprite = new THREE.Sprite(hotspotMaterial);
  hotspotSprite.position.copy(position);
  hotspotSprite.userData.number = number;
  hotspotSprite.scale.set(0.2, 0.2, 1); // Adjust scale as needed
  scene.add(hotspotSprite);

  const rippleTexture = new THREE.CanvasTexture(rippleCanvas);
  const rippleMaterial = new THREE.SpriteMaterial({ map: rippleTexture });
  const rippleSprite = new THREE.Sprite(rippleMaterial);
  rippleSprite.position.copy(position);
  rippleSprite.scale.set(0.3, 0.3, 1); // Adjust scale as needed
  scene.add(rippleSprite);

  const rippleInterval = 1000; // Time interval between ripples in milliseconds
  const duration = 1000; // Duration of each ripple in milliseconds
  const startScale = 0.01; // Initial scale
  const endScale = 2; // Final scale
  const startOpacity = 0.5; // Initial opacity
  const endOpacity = 0.1; // Final opacity

  // Animate the continuous ripple effect
  function animateRipple() {
    const startTime = Date.now();

    function animate() {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // Update scale and opacity based on progress
      const scale = startScale + (endScale - startScale) * progress;
      const opacity = startOpacity + (endOpacity - startOpacity) * progress;

      hotspotCtx.clearRect(0, 0, size, size);
      hotspotCtx.beginPath();
      const gradient = hotspotCtx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.5)');
      hotspotCtx.fillStyle = gradient;
      hotspotCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      hotspotCtx.fill();
      // hotspotCtx.fillStyle = 'black'; // Number color
      // hotspotCtx.font = '25px Arial'; // Number font
      hotspotCtx.textAlign = 'center';
      hotspotCtx.textBaseline = 'middle';
      hotspotCtx.fillText(number, size / 2, size / 2);
      hotspotTexture.needsUpdate = true;

      rippleCtx.clearRect(0, 0, size, size);
      rippleCtx.beginPath();
      rippleCtx.arc(size / 2, size / 2, size / 2 * scale, 0, Math.PI * 2);
      rippleCtx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      rippleCtx.lineWidth = 4;
      rippleCtx.stroke();
      rippleTexture.needsUpdate = true;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(animateRipple, rippleInterval);
      }
    }

    animate();
  }

  animateRipple();

  hotspotSprite.lookAt(position.clone().add(tiltDirection));
  return hotspotSprite;
}

// Add event listener to detect mouse clicks on hotspots

document.addEventListener('click', onClickHotspot);

// Create a modal element
const modal = document.createElement('div');
modal.style.position = 'fixed';
modal.style.top = '50%';
modal.style.left = '50%';
modal.style.transform = 'translate(-50%, -50%)';
modal.style.padding = '20px';
modal.style.backgroundColor = 'white';
modal.style.border = '1px solid black';
modal.style.zIndex = '9999';
modal.style.display = 'none'; // Initially hide the modal

// Append modal to the document body
document.body.appendChild(modal);

// Add event listener to detect clicks outside the modal
document.body.addEventListener('click', (event) => {
  // If the clicked element is not inside the modal, hide the modal
  if (!modal.contains(event.target)) {
    modal.style.display = 'none';
  }
});


function onClickHotspot(event) {
  if (hotspots) {
    // Calculate mouse position relative to the canvas
    const mouse = new THREE.Vector3(
      (event.clientX / sizes.width) * 2 - 1,
      -(event.clientY / sizes.height) * 2 + 1
    );

    // Raycast to detect intersections with hotspots
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(hotspots);

    // If there are intersections, handle the click event
    if (intersects.length > 0) {
      const hotspot = intersects[0].object;
      const hotspotNumber = hotspot.userData.number;
      const hotspotPosition = intersects[0].point; // Position of the clicked hotspot

      // Define distance offset to keep the camera at a reasonable distance from the object
      const distanceOffset = 5; // Adjust as needed

      // Calculate the direction vector from the camera to the hotspot
      const direction = hotspotPosition.clone().sub(camera.position).normalize();

      // Calculate the final camera position by adding the distance offset to the hotspot position along the direction vector
      const finalCameraPosition = hotspotPosition.clone().add(direction.multiplyScalar(distanceOffset));

      // Animate the camera to move towards the final camera position
      gsap.to(camera.position, {
        duration: 1, // Duration of the camera animation in seconds
        x: finalCameraPosition.x,
        y: finalCameraPosition.y,
        z: finalCameraPosition.z,
        onUpdate: () => {
          // Update the camera's lookAt target while animating
          camera.lookAt(hotspotPosition);
        },
        onComplete: () => {
          // Update the popup content based on the hotspot number
          switch (hotspotNumber) {
            case '1':
              document.getElementById('popupText').textContent = data.desc1;
              break;
            case '2':
              document.getElementById('popupText').textContent = data.desc2;
              break;
            case '3':
              document.getElementById('popupText').textContent = data.desc3;
              break;
            default:
              break;
          }
          // Show the popup after the camera animation completes
          document.getElementById('popup').style.display = 'block';
        }
      });
    } else {
      // Hide the popup if no hotspot is clicked
      document.getElementById('popup').style.display = 'none';
    }
  }
}


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
// controls.autoRotate = true;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

toggleButton.addEventListener('click', () => {
  autoRotateEnabled = !autoRotateEnabled;
  controls.autoRotate = autoRotateEnabled;
});

window.addEventListener('resize', () => {
  sizes.height = sizes.height,
    sizes.width = sizes.width

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height)
})

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  controls.update(); // Update controls
}
animate();




// const load = gsap.timeline({ defaults: { duration: 3 } })
// load.fromTo(document.scale, { z: 0, x: 0, y: 0 }, { z: 1, x: 1, y: 1 })

