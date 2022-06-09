import * as THREE from '/js/three.module.js';
import { OrbitControls } from "/js/OrbitControls.js"
import { GLTFLoader } from "/js/GLTFLoader.js";
import { Sky } from '/js/Sky.js';
import { Water } from '../Water2.js';

//variable declaration section
let controls, clock, physicsWorld, scene, camera, cam2, renderer, rigidBodies = [], tmpTrans = null
let kObject = null, ballObject = null, moveDirection = { left: 0, right: 0, forward: 0, back: 0 }
let cbContactResult, tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();
let ammoTmpPos = null, ammoTmpQuat = null;
let model = null, mixer = null, animationsMap = null, currentAction, cameraTarget = null;
let walkDirection = null, rotateAngle = null, rotateQuarternion = null, velocity;
var firstPerson = false;
let dirLight;
let diamond, water, flower;

//timer and pausing variables

var clock1 = new THREE.Clock();
var countdown = 180;
var storeCount = 180;
var startedTimer = 0;
var container=0;

const STATE = { DISABLE_DEACTIVATION: 4 }

//initialise ammo
Ammo().then(start)

//start/init function
function start() {
    //load objects 
    //loadManager();

    //array of bodies
    tmpTrans = new Ammo.btTransform();
    ammoTmpPos = new Ammo.btVector3();
    ammoTmpQuat = new Ammo.btQuaternion();

    //setup physics
    setupPhysicsWorld();

    //setup and create objects
    setupGraphics();
    createBlock();
    createWalls();
    createBall();
    loadCharacter();

    //setup callbacks
    setupContactResultCallback();
    setupEventHandlers();

    //run graphics
    renderFrame();

    
    // adding timer stuff to the screen. Note that this works in conjunction with main.css code
    //inspired by: https://github.com/drnoir/animated-Three-js-Landing-page-template-with-counter

    container = document.createElement( 'div' );
    container.style.width = 90%
    container.style.alignSelf;
    document.body.appendChild( container );
  
    var timer = document.createElement( 'div' );
    var timerSec = document.createElement( 'div' );


    timer.style.position = 'absolute';
    timer.style.color = 'white';
    timer.style.top = '0%';
    timer.style.textAlign = 'center';
    timer.style.width = '100%';
    timer.style.margin = '0 auto';
    timer.style.fontFamily= "Macondo";
    timer.innerHTML = '<div id = "timer"></div>'

    timerSec.style.width = "25%";
    timerSec.style.fontSize = "2em";
    timerSec.style.textAlign = 'center';
    timerSec.style.fontFamily= "Macondo";

    container.appendChild( timer );
    timer.appendChild( timerSec );
    

    document.getElementById("instruct").style.width = "100%";
    var beginButton = document.getElementById("begin");

    beginButton.style.width="200px";
    beginButton.style.height= "70px";
    beginButton.style.position="relative";
    beginButton.style.color="#e4d9c9";
    beginButton.style.borderColor="#e4d9c9";

    clock.stop();
    // 3. Add event handler
    beginButton.addEventListener ("click", function() {
        clock.start();
        document.getElementById("instruct").style.width = "0%";
        startTimer();
    });

}

//set up loading manager

function lm(){
    const loadingManager = new THREE.LoadingManager(); //create a loading manager

    const progressBar = document.getElementById('progress-bar'); //refering to css loading bar 
    loadingManager.onProgress = function(url,loaded,total){ //onprogress gives loaded and total %
        progressBar.value = (loaded/total)*100; //moving loading bar 
    }

    const progressBarContainer = document.querySelector('.progress-bar-container'); //refers to the overlay of progress bar in css
    loadingManager.onLoad = function(){ //onload tells us when loading is complete
        progressBarContainer.style.display = 'none'; //remove when loading complete
    }
    return loadingManager
}


//set up worlds physics
function setupPhysicsWorld() {
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache = new Ammo.btDbvtBroadphase(),
        solver = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}

//set up worlds graphics
function setupGraphics() {
    //create clock for timing
    clock = new THREE.Clock();

    //create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    //create cameras
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 1000);
    camera.position.set(0,200,0);

    cam2 = new THREE.PerspectiveCamera(
        60, window.innerHeight / window.innerHeight,
        0.1,
        1000
    );
    cam2.position.set(0, 100, 0);
    cam2.lookAt(0, 0, 0);

    //add ambient light
    let ambientLight = new THREE.AmbientLight(0xeeeeee);
    ambientLight.intensity = 0.5;
    scene.add(ambientLight);

    //add directional light
    dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);


    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 9000;
    dirLight.shadow.mapSize.height = 9000;
    let d = 75;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 13500;
    scene.add(dirLight);

    //setup the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xbfd1e5);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;

    //add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    //Dynamic SkyBox
    initSky();

    //Diamond
    diamond = getDiamond();
    diamond.scale.set(0.5, 0.5, 0.5);

    //WHERE THE DIAMOND IS LOCATED
    diamond.position.set(42, 5, 42);
    scene.add(diamond);

    //Water
    water = getWater(1, 1); //water
    water.scale.set(100, 100, 100);
    scene.add(water);

    //Torch
    createTorch(-42, -50, 0);
    createTorch(-50, -42, Math.PI / 2);
    createTorch(45, 42, -Math.PI / 2);
    createTorch(42, 45, Math.PI);

    //flower
    let flower = getflower();
    flower.position.set(-42, 5, -12);
    flower.scale.set(0.02, 0.02, 0.02);
    scene.add(flower);

    let flower1 = getflower();
    flower1.position.set(-42, 5, 7);
    flower1.scale.set(0.02, 0.02, 0.02);
    scene.add(flower1);
}

//render frame
function renderFrame() {
    let deltaTime = clock.getDelta();

    //update objects
    updatePhysics(deltaTime);
    moveCharacter(deltaTime);
    updateCamera();

    //update camera
    controls.update();

    //Dynamic SkyBox
    timeElapsed = clock1.getElapsedTime();
    phi = timeElapsed * 0.02 * Math.PI - Math.PI / 2;

    sun.setFromSphericalCoords(1, phi, theta);

    dirLight.position.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sun);

    //Diamond
    diamond.rotation.x += 0.02;
    diamond.rotation.y += 0.02;
    diamond.rotation.z += 0.02;

    if (timeElapsed < 180) {
        water.position.set(0, timeElapsed * 0.055, 0);
    }
    else {
        water.position.set(0, 180 * 0.055, 0);
    }

    //render updates
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight); //Main camera view
    renderer.setScissorTest(false);
    renderer.render(scene, camera);

    renderer.setViewport(50, 50, 200, 200); //Minimap camera view
    renderer.setScissor(50, 50, 200, 200);
    renderer.setScissorTest(true);
    renderer.render(scene, cam2);
    requestAnimationFrame(renderFrame);
}

//setup event handlers
function setupEventHandlers() {
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', handleKeyDown, false);
    window.addEventListener('keyup', handleKeyUp, false);
}

//resize window
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

var clock1 = new THREE.Clock();
var timeElapsed;

var uniforms;
let sky, sun;
var phi;
var theta = 0;

function initSky() {

    // Add Sky
    sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    sun = new THREE.Vector3();

    uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = 1;
    uniforms['rayleigh'].value = 0.5;
    uniforms['mieCoefficient'].value = 0.1;
    uniforms['mieDirectionalG'].value = 1;

    renderer.toneMappingExposure = 0.1;
    renderer.render(scene, camera);
}

//Diamond
function getDiamond() {
    const geometry = new THREE.ConeGeometry(2, 5, 6);
    const material = new THREE.MeshStandardMaterial({
        color: 0xf9f9f9,
        metalness: 1,
        roughness: 0.5,
        shininess: 50
    });
    const cone = new THREE.Mesh(geometry, material);

    cone.rotation.x = Math.PI;

    const geometryB = new THREE.ConeGeometry(2, 2, 6);
    const materialB = new THREE.MeshStandardMaterial({
        color: 0xf9f9f9,
        metalness: 1,
        roughness: 0.5,
        shininess: 50
    });
    const coneB = new THREE.Mesh(geometryB, materialB);

    coneB.rotation.x = Math.PI;
    coneB.position.y = -3.5;

    cone.castShadow = true;
    cone.receiveShadow = true;

    cone.add(coneB);

    return cone;
}

function getWater(q, w) {
    const waterGeo = new THREE.PlaneGeometry(q, w);

    const water = new Water(waterGeo, {
        scale: 4,
        flowspeed: 0.7,
        reflectivity: 0.3,
    });

    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = true;

    return water;
}

function getLight() {
    const ironMan = new THREE.PointLight(0xfda50f);
    ironMan.intensity = 1;
    ironMan.distance = 25;
    ironMan.decay = 2;
    ironMan.castShadow = true;

    return ironMan;
}

function createTorch(xpos, zpos, yrot) {
    //objects dimensions
    let pos = { x: xpos, y: 7, z: zpos };
    let scale = { x: 6, y: 6, z: 6 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;

    //load from glb file
    new GLTFLoader(lm()).load('../torch/scene.gltf', function (gltf) {
        let torch = gltf.scene;
        //add shadows
        torch.traverse(function (object) {
            if (object.isMesh) {
                object.castShadow = true;
            }
        });

        //set positions
        torch.scale.set(scale.x, scale.y, scale.z);
        torch.rotation.y = yrot;
        //torch.rotation.y = Math.PI;
        //torch.rotation.x = Math.PI/2;
        torch.position.x = pos.x;
        torch.position.y = pos.y;
        torch.position.z = pos.z;

        //add to scene
        let light = getLight();
        torch.add(light);

        scene.add(torch);
        //sarcophagus.userData.tag = "sarcophagus";
    });

}

//flower
function petal(col, size, c) {
    const material = new THREE.MeshStandardMaterial({ color: col, roughness: 1, shininess: 50 });
    var geometry = new THREE.IcosahedronBufferGeometry(size, c);
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
}




function cone(rad, h, col) { //creating a cone object
    const geometry = new THREE.ConeGeometry(rad, h, 32);
    const material = new THREE.MeshPhongMaterial({ color: col });
    material.shininess = 100;
    const cone = new THREE.Mesh(geometry, material);

    return cone;
}

function getflower() {

    var petal1 = petal(0xf94449, 70, 0); //create the first cone
    var petal2 = petal(0xee6b6e, 50, 0);
    var petal3 = petal(0xee6b6e, 50, 0);
    var petal4 = petal(0xee6b6e, 50, 0);

    petal2.position.x = 30;
    petal2.position.y = 10;
    petal2.position.z = 2;
    petal2.rotation.y = Math.PI / 8;

    petal3.position.x = -30;
    petal3.position.y = 10;
    petal3.position.z = 2;
    petal3.rotation.y = Math.PI / 8;

    petal4.position.x = 1;
    petal4.position.y = 25;
    petal4.position.z = 1;

    petal1.add(petal2);
    petal1.add(petal3);
    petal1.add(petal4);

    var cone1 = cone(15, 150, 0x1b663e); //create the first cone
    cone1.position.x = 0;
    cone1.position.y = -60;
    cone1.position.z = 0;
    petal1.add(cone1);

    return petal1;
}

//handle keypresses
function handleKeyDown(event) {
    let keyCode = event.keyCode;
    switch (keyCode) {
        case 87: //W: FORWARD
            moveDirection.forward = 1
            break;
        case 83: //S: BACK
            moveDirection.back = 1
            break;
        case 65: //A: LEFT
            moveDirection.left = 1
            break;
        case 68: //D: RIGHT
            moveDirection.right = 1
            break;
        case 84://T
            checkContact();
            interact();
            break;
        case 17:
            firstPerson = !firstPerson;
            break;
    }
}

//handle keypresses
function handleKeyUp(event) {
    let keyCode = event.keyCode;
    switch (keyCode) {
        case 87: //FORWARD
            moveDirection.forward = 0
            break;
        case 83: //BACK
            moveDirection.back = 0
            break;
        case 65: //LEFT
            moveDirection.left = 0
            break;
        case 68: //RIGHT
            moveDirection.right = 0
            break;
    }
}

//create world base
function createBlock() {
    //world base dimensions
    let pos = { x: 0, y: 0, z: 0 };
    let scale = { x: 100, y: 2, z: 100 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;

    //threeJS Section
    const texture = new THREE.TextureLoader().load(["../Grass_ground.jpg"]);

    let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({ map: texture }));
    //set position and scale
    blockPlane.position.set(pos.x, pos.y, pos.z);
    blockPlane.scale.set(scale.x, scale.y, scale.z);
    //set shadows
    blockPlane.castShadow = true;
    blockPlane.receiveShadow = true;
    //name
    blockPlane.userData.tag = "floor";
    //add to world
    scene.add(blockPlane);

    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);
    //make collision shape
    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    colShape.setMargin(0.05);
    //set inertia
    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    //make rigid bodies
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    //add friction
    body.setFriction(4);
    body.setRollingFriction(4);
    //add to physics world
    physicsWorld.addRigidBody(body);
    body.threeObject = blockPlane;
}

//array of maze
var amaze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

//create maze walls
function createWalls() {
    //wall dimensions
    let s = 5;
    let pos = { x: 0, y: 2.5, z: 0 };
    let scale = { x: s, y: 16, z: s };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;


    var maze = new THREE.Object3D();
    for (let r = 0; r < 21; r++) {
        for (let c = 0; c < 21; c++) {
            if (amaze[r][c] == 1) {
                let x = (r - 10.5) * s;
                let y = pos.y;
                let z = (c - 10.5) * s;
                //threeJS Section
                const texture = new THREE.TextureLoader().load(["../bark.jpg"]);

                let wall = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({ map: texture }));
                //position and scale
                wall.position.set(x, y, z);
                wall.scale.set(scale.x, scale.y, scale.z);
                //set shadows
                wall.castShadow = true;
                wall.receiveShadow = true;
                //name wall
                wall.userData.tag = "wall at " + x.toString() + ":" + z.toString();
                //add to maze
                maze.add(wall);

                //Ammojs Section
                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(x, y, z));
                transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
                let motionState = new Ammo.btDefaultMotionState(transform);
                //make collision shape
                let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
                colShape.setMargin(0.05);
                //set inertia
                let localInertia = new Ammo.btVector3(0, 0, 0);
                colShape.calculateLocalInertia(mass, localInertia);
                //make rigid bodies
                let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
                let body = new Ammo.btRigidBody(rbInfo);
                //add friction
                body.setFriction(4);
                body.setRollingFriction(10);
                //add to physcis world
                physicsWorld.addRigidBody(body);
                //link three and ammo objects
                body.threeObject = wall;
            }
        }
    }
    //add to world
    scene.add(maze);
}

//create ball
function createBall() {
    //ball dimensions
    let pos = { x: -43, y: 1, z: -43 };
    let radius = 2;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 1;

    //threeJS Section
    let ball = ballObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({ color: 0xff0505 }));
    //set positions
    ball.position.set(pos.x, pos.y, pos.z);
    //set shadows
    ball.castShadow = true;
    ball.receiveShadow = true;
    //name ball
    ball.userData.tag = "ball";
    //add to world

    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);
    //make collision shape
    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);
    //set inertia
    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    //make rigid bodies
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    //add friction
    body.setFriction(4);
    body.setRollingFriction(4);
    //set activation state
    body.setActivationState(STATE.DISABLE_DEACTIVATION)
    //add to physics world
    physicsWorld.addRigidBody(body);
    //link and start                                          
    ball.userData.physicsBody = body;
    rigidBodies.push(ball);
    body.threeObject = ball;
}

//create dude
function loadCharacter() {
    //character dimesnions
    let s = 5;

    let pos = { x: -43, y: 1, z: -43 };

    //let pos = { x: 0, y: 1, z: 0 };
    let scale = { x: s, y: s, z: s };

    //load from glb file
    new GLTFLoader(lm()).load('/js/Soldier.glb', function (gltf) {
        model = gltf.scene;
        //add shadows
        model.traverse(function (object) {
            if (object.isMesh) {
                object.castShadow = true;
            }
        });
        //set positions
        model.scale.set(scale.x, scale.y, scale.z);
        model.position.x = pos.x;
        model.position.y = pos.y;
        model.position.z = pos.z;
        //add to scene
        scene.add(model);
        model.userData.tag = "dude";
        //get animations
        const gltfAnimations = gltf.animations;
        mixer = new THREE.AnimationMixer(model);
        animationsMap = new Map();
        gltfAnimations.filter(a => a.name != 'TPose').forEach((a) => {
            animationsMap.set(a.name, mixer.clipAction(a));
        });
        currentAction = 'Idle';
        animationsMap.forEach((value, key) => {
            if (key == currentAction) {
                value.play();
            }
        });
        //set up stuff for character animation
        walkDirection = new THREE.Vector3();
        rotateAngle = new THREE.Vector3(0, 1, 0);
        rotateQuarternion = new THREE.Quaternion();
        cameraTarget = new THREE.Vector3();
        velocity = 10;
    });
}

//move character
function moveCharacter(deltaTime) {
    if (model == null || animationsMap == null || mixer == null) {
        return
    } else {
        //move model to match physics object
        let currPosition = ballObject.userData.physicsBody.threeObject.position;
        model.position.x = currPosition.x;
        //model.position.y = currPosition.y;
        model.position.z = currPosition.z;
        //switch between animations if moving
        let play = '';
        let fade = 0.2;
        let moveX = moveDirection.right - moveDirection.left;
        let moveZ = moveDirection.back - moveDirection.forward;
        let moveY = 0;
        if (moveX == 0 && moveY == 0 && moveZ == 0) {
            play = 'Idle';
        } else {
            play = 'Walk';
        }
        //switch between animations if moving
        if (currentAction != play) {
            const toPlay = animationsMap.get(play);
            const current = animationsMap.get(currentAction);
            current.fadeOut(fade);
            toPlay.reset().fadeIn(fade).play();
            currentAction = play;
        }
        mixer.update(deltaTime);
        //update look direction
        if (currentAction == 'Walk') {
            // calculate towards camera direction
            var angleYCameraDirection = Math.atan2((camera.position.x - model.position.x), (camera.position.z - model.position.z));
            // diagonal movement angle offset
            var directionOffset = directionsOffset();
            // rotate model
            rotateQuarternion.setFromAxisAngle(rotateAngle, angleYCameraDirection + directionOffset);
            model.quaternion.rotateTowards(rotateQuarternion, 0.2);
            // calculate direction
            camera.getWorldDirection(walkDirection);
            walkDirection.y = 0;
            walkDirection.normalize();
            walkDirection.applyAxisAngle(rotateAngle, directionOffset);
            // move model & camera
            const moveX = walkDirection.x;
            const moveY = 0;
            const moveZ = walkDirection.z;
            //result of movement
            let resultantImpulse = new Ammo.btVector3(moveX, moveY, moveZ)
            resultantImpulse.op_mul(velocity);
            //set velocity
            let physicsBody = ballObject.userData.physicsBody;
            physicsBody.setLinearVelocity(resultantImpulse);


        }
    }
}

//update camera
function updateCamera() {
    if (controls == null || model == null) {
        return;
    } else {
        //check if first person
        if (firstPerson) {
            controls.maxPolarAngle = Math.PI;
            controls.minPolarAngle = Math.PI / 2;
            controls.minDistance = 0;
            controls.maxDistance = 0.1;
        } else {
            controls.maxPolarAngle = Math.PI / 2;
            controls.minPolarAngle = 0;
            controls.minDistance = 5;
            controls.maxDistance = 5.1;
        }
        //update camera target
        cameraTarget.x = model.position.x;
        cameraTarget.y = model.position.y + 10;
        cameraTarget.z = model.position.z;
        controls.target = cameraTarget;
    }
}

//calculate directional offset
function directionsOffset() {
    var directionOffset = 0; //w
    if (moveDirection.forward == 1) {
        if (moveDirection.left == 1) {
            directionOffset = Math.PI / 4; // w+a
        }
        else if (moveDirection.right == 1) {
            directionOffset = -Math.PI / 4; // w+d
        }
    }
    else if (moveDirection.back == 1) {
        if (moveDirection.left == 1) {
            directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
        }
        else if (moveDirection.right == 1) {
            directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
        }
        else {
            directionOffset = Math.PI; // s
        }
    }
    else if (moveDirection.left == 1) {
        directionOffset = Math.PI / 2; // a
    }
    else if (moveDirection.right == 1) {
        directionOffset = -Math.PI / 2; // d
    }
    return directionOffset;
}

//contact test
function setupContactResultCallback() {
    //create callabck
    cbContactResult = new Ammo.ConcreteContactResultCallback();

    cbContactResult.addSingleResult = function (cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1) {

        let contactPoint = Ammo.wrapPointer(cp, Ammo.btManifoldPoint);

        const distance = contactPoint.getDistance();

        if (distance > 0) return;

        let colWrapper0 = Ammo.wrapPointer(colObj0Wrap, Ammo.btCollisionObjectWrapper);
        let rb0 = Ammo.castObject(colWrapper0.getCollisionObject(), Ammo.btRigidBody);

        let colWrapper1 = Ammo.wrapPointer(colObj1Wrap, Ammo.btCollisionObjectWrapper);
        let rb1 = Ammo.castObject(colWrapper1.getCollisionObject(), Ammo.btRigidBody);

        let threeObject0 = rb0.threeObject;
        let threeObject1 = rb1.threeObject;

        let tag, localPos, worldPos

        if (threeObject0.userData.tag != "ball") {

            tag = threeObject0.userData.tag;
            localPos = contactPoint.get_m_localPointA();
            worldPos = contactPoint.get_m_positionWorldOnA();

        }
        else {

            tag = threeObject1.userData.tag;
            localPos = contactPoint.get_m_localPointB();
            worldPos = contactPoint.get_m_positionWorldOnB();

        }

        let localPosDisplay = { x: localPos.x(), y: localPos.y(), z: localPos.z() };
        let worldPosDisplay = { x: worldPos.x(), y: worldPos.y(), z: worldPos.z() };

        console.log({ tag, localPosDisplay, worldPosDisplay });

    }

}

//interact with things in the scene
function interact() {
    //default contact is false
    cbContactPairResult.hasContact = false;
    //do contact test
    physicsWorld.contactPairTest(ballObject.userData.physicsBody, sarcophagus.userData.physicsBody, cbContactPairResult);
    physicsWorld.contactPairTest(ballObject.userData.physicsBody, landing.userData.physicsBody, cbContactPairResult);
    //if false return
    if (!cbContactPairResult.hasContact) return;

    else {//else there is contact; trigger timer 
        startTimer();
        //add water and make it rise
        addWater();
        waterRising = true;
    }
}

//check for contact
function checkContact() {
    physicsWorld.contactTest(ballObject.userData.physicsBody, cbContactResult);
}

//update physics
function updatePhysics(deltaTime) {
    // step world
    physicsWorld.stepSimulation(deltaTime, 10);
    // update rigid bodies
    for (let i = 0; i < rigidBodies.length; i++) {
        let objThree = rigidBodies[i];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if (ms) {
            //update objects in motion
            ms.getWorldTransform(tmpTrans);
            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }
}


//for pausing and unpausing
pauseButton.addEventListener("click", function () {

    //pausing
    clock.stop(); //stopping scene clock
    clock1.stop(); //stopping timer clock
    storeCount = countdown;

    //  console.log("storecount is"+ storeCount);

});

closeMenu.addEventListener("click", function () {//unpause game when pause menu is closed
    clock.start();
    clock1.start();
    console.log("storecount is" + storeCount);
});

function startTimer() { //controls the maze timer

    //inspired by: https://github.com/drnoir/animated-Three-js-Landing-page-template-with-counter

    startedTimer = 1; //so that the start of the clock cannot be triggered twice
    clock1.start()

    var x = setInterval(function () {

        // Get how much time has passed since level started
        var now = clock1.getElapsedTime();

        //get how much time has passed since getElapsedTime was called
        var currently = clock1.getDelta();

        var endTime = currently + storeCount;

        // Find the number of seconds between now and when the timer will end
        countdown = endTime - now;
        //storeCount = countdown;
        console.log("countdown in timer is " + countdown)
        console.log("storecount is " + countdown)
        var seconds = Math.floor(countdown);

        //displays time left while timer clock is running
        if (clock1.running == true) {
            document.getElementById("timer").innerHTML = "<h1>Time left</h1><div class ='timerSec'>" + seconds + " seconds" + '</div></div>';
        }

        //event that checks if character has intersected with goal point; win condition


        if (model.position.x <= diamond.position.x-2 && model.position.x <diamond.position.x+2){
            if (Math.abs(model.position.z - diamond.position.z) <= 5) {

                clearInterval(x);
                location.href = '../level transitioning/levelOneCleared.html'
            }
        }

            // display a message when the countdown is over
            if (storeCount < 0 || countdown < 0) {
                clearInterval(x);
                //document.getElementById("timer").innerHTML = "<h1>TIME'S UP!</h1>";
                location.href ='../level transitioning/timeRunOut1.html'
            }


        }, 1000);
}
