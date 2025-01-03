import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js';
import gsap from 'gsap';
import data from './data';

const canvas = document.getElementById('canvas');
const loadingOverlay = document.getElementById('loadingOverlay');
const zoomInButton = document.getElementById('zoomInButton');
const zoomOutButton = document.getElementById('zoomOutButton');
const toggleButton = document.getElementById("toggleButton")
const rotateLeft = document.getElementById('rotateLeft');
const rotateRight = document.getElementById('rotateRight');
const rotateUp = document.getElementById('rotateUp');
const rotateDown = document.getElementById('rotateDown');
const closeButton= document.getElementById('closeButton'); 
let hotspotPosition
let autoRotateEnabled = false;
let finalCameraPosition

const hotspots = [];
const sizes = {
    height: window.innerHeight,
    width: window.innerWidth
};



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.5, 100);
const renderer = new THREE.WebGLRenderer({ canvas });
initializeRenderer();
initializeLights();
initializeScene();

function initializeRenderer() {
    renderer.setClearColor('rgb(2,0,36)');
    renderer.setSize(sizes.width, sizes.height); // set main container height
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.EquirectangularReflectionMapping;
    renderer.toneMappingExposure = 4;
    renderer.setPixelRatio(window.devicePixelRatio * 2);
    renderer.pixelArt = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
}

function initializeLights() {
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.1);
    scene.add(ambientLight);
}

function initializeScene() {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('./assets/textures/MR_INT-001_NaturalStudio_NAD.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;

        const loader = new GLTFLoader()
        // .setPath('./assets/models/google-pixel-7pro/');
        loader.load('./assets/models/iphone_14_pro_max_original/scene.gltf', (gltf) => {
            const model = gltf.scene;
            model.scale.set(40, 40, 40);
            scene.add(model);
            model.position.y = -2;
            camera.position.set(0, 4, 16);
            loadingOverlay.style.display = 'none';
            addHotspots();
        });
    });
}

function addHotspots() {
    data.forEach((item, index) => {
        // Extract x, y, and z values from the location object
        const { x, y, z } = item.location;
        const vector3 = new THREE.Vector3(x, y, z);
        
        // Push the new hotspot to the 'hotspots' array using the createHotspot function
        hotspots.push(createHotspot(vector3, (index + 1).toString(), new THREE.Vector3(1, 0, 0)));
    });
}

function createHotspot(position, number, tiltDirection) {
    const hotspotCanvas = createCanvas();
    const rippleCanvas = createCanvas();
    const hotspotSprite = createHotspotSprite(position, number, hotspotCanvas, tiltDirection);
    const rippleSprite = createRippleSprite(position, rippleCanvas);
    animateRippleEffect(hotspotCanvas, rippleCanvas, number);
    return hotspotSprite;
}

function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    return canvas;
}

function createHotspotSprite(position, number, canvas, tiltDirection) {
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.userData.number = number;
    sprite.scale.set(0.2, 0.2, 1);
    scene.add(sprite);
    sprite.onPointerOver = function (event) {
        document.body.style.cursor = 'pointer';
    };
    sprite.onPointerOut = function (event) {
        document.body.style.cursor = 'auto';
    };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.5)');
    ctx.fillStyle = gradient;
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number, canvas.width / 2, canvas.height / 2);
    texture.needsUpdate = true;
    sprite.lookAt(position.clone().add(tiltDirection));
    return sprite;
}

function createRippleSprite(position, canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(0.3, 0.3, 1);
    scene.add(sprite);
    return sprite;
}

function animateRippleEffect(hotspotCanvas, rippleCanvas, number) {
    const hotspotCtx = hotspotCanvas.getContext('2d');
    const rippleCtx = rippleCanvas.getContext('2d');
    const hotspotTexture = new THREE.CanvasTexture(hotspotCanvas);
    const rippleTexture = new THREE.CanvasTexture(rippleCanvas);
    const rippleInterval = 1000;
    const duration = 1000;
    const startScale = 0.01;
    const endScale = 2;
    const startOpacity = 0.5;
    const endOpacity = 0.1;

    function animateRipple() {
        const startTime = Date.now();

        function animate() {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const scale = startScale + (endScale - startScale) * progress;
            const opacity = startOpacity + (endOpacity - startOpacity) * progress;

            hotspotCtx.clearRect(0, 0, hotspotCanvas.width, hotspotCanvas.height);
            hotspotCtx.beginPath();
            const gradient = hotspotCtx.createRadialGradient(hotspotCanvas.width / 2, hotspotCanvas.height / 2, 0, hotspotCanvas.width / 2, hotspotCanvas.height / 2, hotspotCanvas.width / 2);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.5)');
            hotspotCtx.fillStyle = gradient;
            hotspotCtx.arc(hotspotCanvas.width / 2, hotspotCanvas.height / 2, hotspotCanvas.width / 2, 0, Math.PI * 2);
            hotspotCtx.fill();
            hotspotCtx.fillStyle = 'red';
            hotspotCtx.textAlign = 'center';
            hotspotCtx.textBaseline = 'middle';
            hotspotCtx.fillText(number, hotspotCanvas.width / 2, hotspotCanvas.height / 2);
            hotspotTexture.needsUpdate = true;

            rippleCtx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height);
            rippleCtx.beginPath();
            rippleCtx.arc(rippleCanvas.width / 2, rippleCanvas.height / 2, rippleCanvas.width / 2 * scale, 0, Math.PI * 2);
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
}


function displayPopupModel(hotspotNumber,hotspotPosition,displayPopupModel,lookAtPosition) {
    // console.log("hotspot position",hotspotPosition)
    gsap.to(camera.position, {
        duration: 0.3,
        // x: finalCameraPosition.x,
        // y: finalCameraPosition.y,
        // z: finalCameraPosition.z,
        onUpdate: () => {
            // Update the camera's lookAt target while animating
            // camera.lookAt(lookAtPosition);
        },
onComplete: () => {
    // Find the corresponding hotspot in the data array based on the hotspotNumber
    const hotspot = data.find(item => item.number.toString() === hotspotNumber);
    console.log(hotspot)
    // Check if the hotspot is found
    if (hotspot) {
        // Set the description of the hotspot to the assets text content
        document.getElementById('popupText').textContent = hotspot.desc;
    } else {
        // If the hotspot is not found, set an appropriate default message
        document.getElementById('popupText').textContent = "Description not found.";
    }
    // Display the popup
    document.getElementById('popup').style.display = 'block';
}
    });
}

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

        if (intersects.length > 0) {
            const hotspot = intersects[0].object;
            const hotspotNumber = hotspot.userData.number;
             hotspotPosition = intersects[0].point;

            const distanceOffset = 4;

            const direction = hotspotPosition.clone().sub(camera.position).normalize();

             finalCameraPosition = hotspotPosition.clone().add(direction.multiplyScalar(distanceOffset));
                 // Calculate lookAt position
            const lookAtPosition = hotspotPosition.clone();
            displayPopupModel(hotspotNumber,hotspotPosition,finalCameraPosition,lookAtPosition)
        } else {
            document.getElementById('popup').style.display = 'none';
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
}

closeButton.addEventListener('click', (e) => {
    document.getElementById("popup").style.display = "none"
});

zoomInButton.addEventListener('click', () => {
    gsap.to(camera.position, { duration: 1, z: camera.position.z - 3 });
});

zoomOutButton.addEventListener('click', () => {
    gsap.to(camera.position, { duration: 1, z: camera.position.z + 3 });
});

rotateLeft.addEventListener('click', () => {
    const rotationAmount = -Math.PI / 2; // 45 degrees in radians
    gsap.to(scene.rotation, { duration: 1, y: scene.rotation.y + rotationAmount });
});

rotateRight.addEventListener('click', () => {
    const rotationAmount = Math.PI / 2; // 45 degrees in radians
    gsap.to(scene.rotation, { duration: 1, y: scene.rotation.y + rotationAmount });
});

rotateUp.addEventListener('click', () => {
    const rotationAmount = Math.PI / 2; // 45 degrees in radians
    gsap.to(scene.rotation, { duration: 1, x: scene.rotation.x + rotationAmount });
});

rotateDown.addEventListener('click', () => {
    const rotationAmount = -Math.PI / 2; // 45 degrees in radians
    gsap.to(scene.rotation, { duration: 1, x: scene.rotation.x + rotationAmount });
});


toggleButton.addEventListener('click', () => {
    autoRotateEnabled = !autoRotateEnabled;
    controls.autoRotate = autoRotateEnabled;
});

document.addEventListener('click', onClickHotspot);

const selectElement = document.getElementById("select-hotspot");
selectElement.addEventListener("change", function(event) {
    const selectedOption = event.target.value;
    displayPopupModel(selectedOption,hotspotPosition,finalCameraPosition);
    // console.log("Selected option:", selectedOption,hotspotPosition);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

window.addEventListener('resize', () => {
    sizes.height = sizes.height,
    sizes.width = sizes.width;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
});

animate();



// const rotateTimeline = gsap.timeline();
// rotateTimeline.to(scene.rotation, {
//     duration: 7,
//     y: Math.PI * 2,
//     ease: 'power2.inOut', 
// });

// rotateTimeline.play();