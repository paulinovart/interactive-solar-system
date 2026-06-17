//imports
import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DragControls } from "three/addons/controls/DragControls.js";
import {HDRLoader} from "three/addons/loaders/HDRLoader.js";
//scene

const scene = new THREE.Scene();

let buttonVueEnsemble = document.getElementsByClassName("vue-ensemble-button");
let infoContainer = document.querySelector(".infos-container");
let nomDiv = document.querySelector(".nom-div");
let masseDiv = document.querySelector(".masse-div");
let distanceSoleilDiv = document.querySelector(".distance-soleil-div");
let diametreDiv = document.querySelector(".diametre-div");
let graviteDiv = document.querySelector(".gravite-div");
let inclinaisonAxeRotationDiv = document.querySelector(".inclinaison-axe-rotation-div");
let dureeRevolutionDiv = document.querySelector(".duree-revolution-div");
let dureeRotationDiv = document.querySelector(".duree-rotation-div");
let temperatureDiv = document.querySelector(".temperature-div");
let nombreLunesDiv = document.querySelector(".nombre-lunes-div");


nomDiv.innerHTML ="nom de la planete"

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(1, 1);
let oldHoverObject = null;
let clickedObject = null;


const viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(
  45,
  viewport.width / viewport.height,
  1e-6,
  1e27
);
// simulation de la lumière du soleil
const sunLightColor = 0xFFFFFF;
const sunIntensity = 100;
const sunLight = new THREE.PointLight(sunLightColor, sunIntensity);
scene.add(sunLight);

//lumiere ambiante
const color = 0xFFFFFF;
const intensity = 1;
const light = new THREE.AmbientLight(color, intensity);
scene.add(light);



let cameraPosition = new THREE.Vector3();
camera.position.set(0, 50, 50);
camera.lookAt(0, 0, 0);



const hdrLoader = new HDRLoader(); 
const envMap = await hdrLoader.loadAsync('/Rendu-workshop-3js/public/textures/galaxie.hdr');
envMap.mapping = THREE.EquirectangularReflectionMapping;

scene.environment = envMap;
scene.background = envMap;



//state
let controls, renderer, whiteCircle, baseScale,circlePoint, planetPoint;
let planets = [];
let whiteCircles = [];
let objects = [];
let flyAnim = null;



async function init() {
  initRenderer();
  initControls();
  initScene();
  //initHelpers();

  window.onresize = onWindowResize;
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onClick);
 Array.from(buttonVueEnsemble).forEach((button) => {
  button.addEventListener("click", () => {
    console.log("vue d'ensemble");
    camera.position.set(0, 50, 50);
    camera.lookAt(0, 0, 0);
    infoContainer.classList.add("hidden");
  });
});

}

function onMouseMove(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersection = raycaster.intersectObjects(whiteCircles);

  const hoveredObject = intersection[0]?.object ?? null;
  if (hoveredObject !== oldHoverObject) {
    oldHoverObject = hoveredObject;
  }
}

function clickButtonVueEnsemble(e){
  camera.position.set(0, 20, 20);
camera.lookAt(0, 0, 0);
}





function onClick() {
  // set lers variables position base cam et target (lookat)
  //set la variable de destination 

//au click un lerp qui fonctionne avec la position de départ de la cam
  raycaster.setFromCamera(mouse, camera);

  const intersection = raycaster.intersectObjects(whiteCircles);
  //console.log(whiteCircles);
  //intersection[0].object.name = "active";
 whiteCircles.forEach((object)=> (object.name =""));

if (intersection.length){
clickedObject = intersection[0].object


const destination = clickedObject.position.clone();
const offset = 0.003; // changer apres pour varier en fonction du rayon de la planete si possible
flyAnim = {

  startPosition : camera.position.clone(),
  startTarget : controls.target.clone(),
  targetPosition : new THREE.Vector3(destination.x + offset, destination.y + offset * 0.5, destination.z + offset),
  targetCenter : destination.clone(),
  startTime : performance.now(),
  duration : 1400,
  // anim autours de l'orbite
  orbitAfter : true,
  orbitStartTime : null,
  orbitDuration : 1600,
  orbitRadius : offset ,

}

//camera.position.set(clickedObject.position.x,clickedObject.position.y, clickedObject.position.z+0.003 )
//controls.target.set(clickedObject.position.x,clickedObject.position.y, clickedObject.position.z);






console.log("je clique sur : ", clickedObject);
clickedObject.name="active";
infoContainer.classList.remove("hidden");



const orbit = planets.find((o) => o.sprite === clickedObject);
if (orbit) {

//ajouter le nom de la planete en grand avant le chargement du reste ?

  setTimeout(() => {
    infoContainer.classList.remove("hidden");
  }, 1400);


  nomDiv.innerHTML = orbit.nom;


  masseDiv.innerHTML = orbit.Masse;
  distanceSoleilDiv.innerHTML = orbit.DistanceSoleil;
  diametreDiv.innerHTML = orbit.Diametre;
  graviteDiv.innerHTML = orbit.Gravite;
  inclinaisonAxeRotationDiv.innerHTML = orbit.InclinaisonAxeRotation;
  dureeRevolutionDiv.innerHTML = orbit.DureeRevolution;
  dureeRotationDiv.innerHTML = orbit.DureeRotation;
  temperatureDiv.innerHTML = orbit.Temperature;
  nombreLunesDiv.innerHTML = orbit.NombreLunes;
  



}


}else {
//camera.position.set(20,20);

}


}



function initRenderer() {
  renderer = new THREE.WebGLRenderer({
    logarithmicDepthBuffer: true,
  });
  renderer.setSize(viewport.width, viewport.height);
  renderer.domElement.classList.add("renderer");

  document.body.appendChild(renderer.domElement);
  renderer.setPixelRatio(2);
  renderer.setAnimationLoop(animate);
}

function initScene() {
  //là ou je mets tt ma scene, mes objets etc

  /*
-------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------
FONCTION CREATION TEXTE
-------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------
 */

  function afficherLegende(message) {
    const canvas = document.createElement("canvas");

    const contexte = canvas.getContext("2d");

    contexte.font = "90px Arial";
    contexte.fillStyle = "#ffffff";
    contexte.textAlign = "center";
    contexte.textBaseline = "middle";
    contexte.fillText(message, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true })
    );

    sprite.scale.set(4, 0.5, 1);

    return sprite;
  }

  /*
-------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------
ORBITES TRY FOR EACH
-------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------
 */

  planets = [
    {
      nom: "Mercure",
      x: 1.2,
      y: 1.2,
      color: 0xb78668,
      p: 0.1,
      nombreAnneaux : 0,
      planetRadius: 0.00005,
      baseColor : "/Rendu-workshop-3js/public/textures/mercury.jpg",
      roughness : "/texture/mercury-r.jpg",
   

      DistanceSoleil: "46 à 70 millions de km (0,31 à 0,47 UA)",
      Masse: "3,3 × 1023 kg",
      Diametre: "4 879 km",
      Gravite: "38 % de celle de la Terre",
      InclinaisonAxeRotation: "0,01°",
      DureeRevolution: "88 jours terrestres",
      DureeRotation: "58,6 jours terrestres",
      Temperature: "-180 °C à +430 °C (+67 °C en moyenne à l’équateur)",
      NombreLunes: "0",
  
    },

    {
      nom: "Venus",
      x: 2.2,
      y: 2.2,
      color: 0xf4bebe,
      p: 0.2,
      nombreAnneaux : 0,
      planetRadius: 0.00012,
       baseColor : "/Rendu-workshop-3js/public/textures/venus.jpg",
       roughness : "/Rendu-workshop-3js/public/texture/venus-r.jpg",
    
       DistanceSoleil: "107 à 109 millions de km (0,72 UA)",
       Masse: "4,87 × 10^24 kg",
       Diametre: "12 104 km",
       Gravite: "90 % de celle de la Terre",
       InclinaisonAxeRotation: "177°",
       DureeRevolution: "225 jours terrestres",
       DureeRotation: "243 jours terrestres",
       Temperature: "+460 °C (moyenne)",
       NombreLunes: "0"
    },

    {
      nom: "Terre",
      x: 3,
      y: 3,
      color: 0x67bc5e,
      p: 0.7,
      planetRadius: 0.00013,
      nombreAnneaux : 0,

      baseColor : "/Rendu-workshop-3js/public/textures/earth_base_color_hd.jpg",
      roughness : "/Rendu-workshop-3js/public/texture/2k_earth_specular_map.tif",
      normalMapImage :"/Rendu-workshop-3js/public/texture/2k_earth_normal_map.tif",
      lunesACreer : 1,



      DistanceSoleil: "147 à 152 millions de km (1 UA)",
      Masse: "5,97 × 10^24 kg",
      Diametre: "12 756 km",
      Gravite: "100 %",
      InclinaisonAxeRotation: "23,5°",
      DureeRevolution: "365,25 jours",
      DureeRotation: "24 heures",
      Temperature: "-90 °C à +60 °C (15 °C moyenne)",
      NombreLunes: "1"
    },

    /*{
  nom : "moonOrbit",
  x : ,
  y : 
},*/
    {
      nom: "Mars",
      x: 4.6,
      y: 4.6,
      color: 0xdd4530,
      //color : "linear-gradient(267deg,rgba(221, 69, 48, 0.69) 0%, rgba(221, 69, 48, 0) 100%)",
      p: 1,
      planetRadius: 0.00007,
       baseColor : "/Rendu-workshop-3js/public/textures/mars.jpg",
       roughness : "/Rendu-workshop-3js/public/texture/mars-r.jpg",
       normalMapImage :"/Rendu-workshop-3js/public/texture/mars_normal_map.jpg",
       nombreAnneaux : 0,
       lunesACreer : 2,

       DistanceSoleil: "207 à 249 millions de km (1,52 UA)",
       Masse: "6,42 × 10^23 kg",
       Diametre: "6 779 km",
       Gravite: "38 % de celle de la Terre",
       InclinaisonAxeRotation: "25°",
       DureeRevolution: "687 jours terrestres",
       DureeRotation: "24,6 heures",
       Temperature: "-140 °C à +20 °C",
       NombreLunes: "2"
    },


    {
      nom: "Jupiter",
      x: 15.6,
      y: 15.6,
      color: 0xf9d3c0,
      p: 0.4,
      nombreAnneaux : 0.00002,
      planetRadius: 0.00143,
       baseColor : "/textures/jupiter.jpeg",
       ringColor:0xf9d3c0,
       lunesACreer : 4,

       DistanceSoleil: "740 à 816 millions de km (5,2 UA)",
       Masse: "1,90 × 10^27 kg",
       Diametre: "142 984 km",
       Gravite: "2,5 fois celle de la Terre",
       InclinaisonAxeRotation: "3°",
       DureeRevolution: "11,86 ans",
       DureeRotation: "9,9 heures",
       Temperature: "-110 °C",
       NombreLunes: "95"
    },
    {
      nom: "Saturne",
      x: 30,
      y: 30,
      color: 0xffe577,
      nombreAnneaux : 0.0006,
      p: 0.8,
      planetRadius: 0.0012,
       baseColor : "/Rendu-workshop-3js/public/textures/saturn.jpeg",
       ringColor:0xdabb9e,

       DistanceSoleil: "1,35 à 1,51 milliard de km (9,5 UA)",
       Masse: "5,68 × 10^26 kg",
       Diametre: "120 536 km",
       Gravite: "1,07 fois celle de la Terre",
       InclinaisonAxeRotation: "27°",
       DureeRevolution: "29,5 ans",
       DureeRotation: "10,7 heures",
       Temperature: "-140 °C",
       NombreLunes: "146"

    },
    {
      nom: "Uranus",
      x: 57,
      y: 57,
      color: 0x57a0ff,
      nombreAnneaux : 0.00002,
      p: 0,
      planetRadius: 0.00051,
       baseColor : "/Rendu-workshop-3js/public/textures/uranus.jpeg",
       ringColor:0x97c0d6,

       DistanceSoleil: "2,74 à 3,01 milliards de km (19,2 UA)",
       Masse: "8,68 × 10^25 kg",
       Diametre: "51 118 km",
       Gravite: "89 % de celle de la Terre",
       InclinaisonAxeRotation: "98°",
       DureeRevolution: "84 ans",
       DureeRotation: "17 heures",
       Temperature: "-195 °C",
       NombreLunes: "27"
    },
    {
      nom: "Neptune",
      x: 90,
      y: 90,
      color: 0x2948bf,
      nombreAnneaux : 0.00002,
      p: 0.5,
      planetRadius: 0.00049,
      baseColor : "/Rendu-workshop-3js/public/textures/neptune.jpeg",
      ringColor:0x456afc,

      
      DistanceSoleil: "4,45 à 4,55 milliards de km (30,1 UA)",
      Masse: "1,02 × 10^26 kg",
      Diametre: "49 528 km",
      Gravite: "1,14 fois celle de la Terre",
      InclinaisonAxeRotation: "28°",
      DureeRevolution: "165 ans",
      DureeRotation: "16 heures",
      Temperature: "-200 °C",
      NombreLunes: "14"
    },
  ];

  const circleTexture = new THREE.TextureLoader().load("/Rendu-workshop-3js/public/textures/circle.png");
  const circleMaterial = new THREE.SpriteMaterial({
    map: circleTexture,
    transparent: true,
  });

//ajout du soleil

const sunTexture = new THREE.TextureLoader().load("/Rendu-workshop-3js/public/textures/sunmap.jpg")
const sunGeometry = new THREE.SphereGeometry(0.0139 , 32, 16);
const sunMaterial = new THREE.MeshPhysicalMaterial({
  color: "yellow",
  //map: sunTexture,
 // roughnessMap : planetTextureRoughness,
 // normalMap : planetTextureNormalMap,
  // normalmap => fausser des reliefs
  
});

const sun = new THREE.Mesh(sunGeometry, sunMaterial);

scene.add(sun);



  planets.forEach((orbit) => {
    const curve = new THREE.EllipseCurve(
      0,
      0,
      orbit.x,
      orbit.y,
      0,
      2 * Math.PI,
      false,
      0
    );

    circlePoint = curve.getPoint(orbit.p);
    circlePoint.push;

    //création des orbites

    orbit.curve = curve;

    const points = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: orbit.color });


    const ellipse = new THREE.Line(geometry, material);
    ellipse.rotation.x = -Math.PI / 2;
    scene.add(ellipse);
//console.log("orbite créee", orbit.nom);

    //création des planetes

    const texloader = new THREE.TextureLoader();
    const planetTexture = texloader.load(orbit.baseColor);
    const planetTextureRoughness = texloader.load(orbit.roughness);
    const planetTextureNormalMap = texloader.load(orbit.normalMapImage);
    //console.log(orbit.baseColor);
    planetTexture.colorSpace = THREE.SRGBColorSpace;
    planetTextureRoughness.colorSpace = THREE.NoColorSpace;
    planetTexture.roughness = 1;

    const ringGeometry = new THREE.TorusGeometry(orbit.planetRadius*1.8,orbit.nombreAnneaux,2,50);
    const ringMaterial = new THREE.MeshPhysicalMaterial({color: orbit.ringColor});

    const planetGeometry = new THREE.SphereGeometry(orbit.planetRadius, 32, 16);

    const planetMaterial = new THREE.MeshPhysicalMaterial({
      //color: orbit.color,
      map: planetTexture,
      roughnessMap : planetTextureRoughness,
     // normalMap : planetTextureNormalMap,
      // normalmap => fausser des reliefs
      
    });

    // ligne à dupliquer pour les materiaux

    

    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);

    planetPoint = { x: circlePoint.x, y: circlePoint.y };
    planetPoint.push;
    console.log(planetPoint, "planetPoint");

    planet.position.set(planetPoint.x, 0, planetPoint.y);
    ring.position.set(planetPoint.x, 0, planetPoint.y);
    ring.rotateX(90);
    scene.add(planet, ring);
    console.log("planète crée : ", orbit.nom);

    //ajout du rond marqueur de l'emplacement de la planete

    whiteCircle = new THREE.Sprite(circleMaterial);
    whiteCircle.scale.set(0.5, 0.5, 1); // taille visuelle

    whiteCircle.position.set(circlePoint.x, 0, circlePoint.y);
    scene.add(whiteCircle);

    whiteCircle.userData.planet = planet;

    orbit.sprite = whiteCircle;
    whiteCircles.push(whiteCircle);

    //const dragControls = new DragControls(objects, camera, renderer.domElement);

    // afficher la légende (nom de la planète) en dessous de chaque cercle
    const legende = afficherLegende(orbit.nom, {
      fontsize: 50,
      color: "#ffffff",
    });
    legende.position.set(circlePoint.x, 0, circlePoint.y - 0.3); // juste en dessous du cercle
    scene.add(legende);
    orbit.textSprite = legende;
  });
}

function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = true;
 //controls.autoRotate = true;
  controls.autoRotateSpeed = true;
  controls.enableDamping = true;
}

function initHelpers() {
  const gridHelper = new THREE.GridHelper(10, 20);
  const axesHelper = new THREE.AxesHelper(5);
  gridHelper.position.y = -0.5;

  scene.add(gridHelper, axesHelper);
}

function onWindowResize() {
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;
  camera.aspect = viewport.width / viewport.height;
  camera.updateProjectionMatrix();

  renderer.setSize(viewport.width, viewport.height);
}


function animate() {
  // adapter la taille du sprite selon la distance caméra
  planets.forEach((orbit) => {
    
    const distanceCamera = camera.position.distanceTo(orbit.sprite.position);
    baseScale = distanceCamera * 0.05;
    //console.log(baseScale, orbit.nom);

    if (orbit.sprite.name === "active"){

      orbit.sprite.scale.set(baseScale * 2, baseScale * 2, 1);
    } else if (orbit.sprite === oldHoverObject){
      orbit.sprite.scale.set(baseScale * 2, baseScale * 2, 1);

    } else {
      orbit.sprite.scale.set(baseScale, baseScale, 1);
    }

    orbit.textSprite.scale.set(baseScale, baseScale * 0.5, 1);


  });


// animation de transition 
if (flyAnim){
  const now = performance.now();
  const tempsEcoule = now - flyAnim.startTime;
  const t = Math.min(tempsEcoule / flyAnim.duration, 1);
  // ease in 
  const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

//début de la transition, voler jusqu'a la planete
if (t < 1) {
  camera.position.lerpVectors(flyAnim.startPosition, flyAnim.targetPosition, ease);
 // console.log(flyAnim.startPosition, flyAnim.targetPosition);
  controls.target.lerpVectors(flyAnim.startTarget, flyAnim.targetCenter, ease);

  // ensuite ça tourne autour
}else if (flyAnim.orbitAfter){

  if (!flyAnim.orbitStartTime) flyAnim.orbitStartTime = now; 
  const orbitTempsEcoule = now - flyAnim.orbitStartTime;
  const orbitT = Math.min(orbitTempsEcoule / flyAnim.orbitDuration, 1);
  // ralentir
  const orbitEase = 1 - Math.pow(1 - orbitT, 3);
  const angle = orbitEase * Math.PI * 2;
  const r = flyAnim.orbitRadius;
  const center = flyAnim.targetCenter;

  camera.position.set(
    center.x + Math.sin(angle) * r,
    center.y + r * 0.4,
    center.z + Math.cos(angle) * r
  );
  controls.target.copy(center);

  if (orbitT >= 1){
    flyAnim = null;
  }}else{
    flyAnim = null;
  }

};

  controls.update();
  renderer.render(scene, camera);
}

init();

