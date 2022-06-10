import * as THREE from '/js/three.module.js';
import {OrbitControls} from "/js/OrbitControls.js"
import {GLTFLoader} from "/js/GLTFLoader.js";
import {Water} from '/js/Water2.js';
import { CSS2DRenderer, CSS2DObject } from '/js/CSS2DRenderer.js';

//variable declaration section
let controls, clock, physicsWorld, scene, camera, renderer, rigidBodies = [], tmpTrans = null
let ballObject = null, moveDirection = { left: 0, right: 0, forward: 0, back: 0 }
let cbContactResult, cbContactPairResult, sarcophagus, landing, deltaTime,popupMessage,theMessage;
let ammoTmpPos = null, ammoTmpQuat = null, spotLight,torches, water, labelRenderer;
let model = null,mixer = null,animationsMap = null,currentAction,cameraTarget=null;
let walkDirection = null, rotateAngle = null, rotateQuarternion = null, velocity;
var firstPerson = false, waterRising = false;
let cone;

//timer and pausing variables
var clock1 = new THREE.Clock();
var countdown = 30;
var storeCount = 30;
var startedTimer = 0;
var container;

const STATE = { DISABLE_DEACTIVATION : 4 }

//initialise ammo
Ammo().then(start)

/** start function */
function start (){
    //array of bodies
    tmpTrans = new Ammo.btTransform();
    ammoTmpPos = new Ammo.btVector3();
    ammoTmpQuat = new Ammo.btQuaternion();

    //setup physics
    setupPhysicsWorld();

    //setup and create objects
    setupGraphics();
    createFloor();
    createCeiling();
    createWalls();
    createBall();
    createStairs();
    loadCharacter();
    createSarcophagus();
    createLanding();
    createTorches();
    addWater();
    setupPopUp();
    createDiamond();

    //add other html stuff
    setupHtml();

    //setup callbacks
    setupContactResultCallback();
    setupContactPairResultCallback();
    setupEventHandlers();

    //run graphics
    renderFrame();
}

/** sets up worlds physics */
function setupPhysicsWorld(){
    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}

/** set up worlds graphics */
function setupGraphics(){
    //create clock for timing
    clock = new THREE.Clock();

    //create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfd1e5 );

    //create camera
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 1000 );

    //add hemisphere light
    let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
    hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
    hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
    hemiLight.position.set( 0, 50, 0 );
    scene.add( hemiLight );

    //add directional light
    let dirLight = new THREE.DirectionalLight( 0xffffff , 1);
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 100 );
    //scene.add( dirLight );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    let d = 75;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 13500;

    //add spotlight
    spotLight = new THREE.SpotLight(0xffffff ,0.6,0,Math.PI/6);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 30;
    scene.add(camera);
    camera.add(spotLight);
    camera.add(spotLight.target);

    spotLight.position.z = -5;
    spotLight.position.x = -1;
    spotLight.position.z = -1;
    spotLight.target.position.z = -10;


    //setup the renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0xbfd1e5 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;

    //setup label renderer
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild( labelRenderer.domElement );

    //add orbit controls
    controls = new OrbitControls(camera, labelRenderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;


}

/** render frame */
function renderFrame(){
    deltaTime = clock.getDelta();
    
    //update objects
    updatePhysics( deltaTime );
    moveCharacter( deltaTime );
    updateGraphics();

    //update camera
    controls.update();

    //if water is rising rise water
    if(waterRising){
        addPopUp('Quick! Get to the gem before you drown', model.position.x, model.position.y+10,model.position.z);
        riseWater();
        checkWinLose();
    }

    //render updates
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
    requestAnimationFrame( renderFrame );
}

/** setup event handlers */
function setupEventHandlers(){
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', handleKeyDown, false);
    window.addEventListener( 'keyup', handleKeyUp, false);
}

/** resize window */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
}

/** 
 * handle keypresses
 * @param {*} event - event is sent, keycode extracted from event
*/
function handleKeyDown(event){
    let keyCode = event.keyCode;
    switch(keyCode){
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
        case 17://ctrl
            firstPerson = !firstPerson;
            break;
        case 76://ctrl
            riseWater();
            break;
    }
}

/** 
 * handle keyrelease
 * @param {*} event - event is sent, keycode extracted from event
*/
function handleKeyUp(event){
    let keyCode = event.keyCode;
    switch(keyCode){
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

/**add water to scene*/
function addWater(){
    //add plan geo
    const waterGeo = new THREE.PlaneGeometry(1, 1);
    //make water
    water = new Water(waterGeo, {
        scale: 4,
        flowspeed: 0.7,
        reflectivity: 0.3,
    });
    water.rotation.x = -Math.PI/2;
    water.receiveShadow = true;
    water.scale.set(100,100,100);
    water.position.set(0,0,0)
    scene.add(water);  
}

/**increase water level*/
function riseWater(){
    let y = water.position.y+0.01;
    water.position.set(0,y,0);
}

/**add divs for timer and pause menu*/
function setupHtml(){
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
    });
}

/**setup pop up messages*/
function setupPopUp(){
    theMessage = document.createElement('div');
    theMessage.className = 'label';
    theMessage.textContent = '';
    popupMessage = new CSS2DObject(theMessage);
    popupMessage.position.set(0,0,0);
    scene.add(popupMessage);
}

/** 
 * add popup message
 * @param {string} message - the message to be dipalyed by the popup
 * @param {Int} x - x position for popup to be displayed at
 * @param {Int} y - y position for popup to be displayed at
 * @param {Int} z - z position for popup to be displayed at
*/
function addPopUp(message,x,y,z){
    scene.remove(popupMessage);
    theMessage = document.createElement('div');
    theMessage.className = 'label';
    theMessage.textContent = message;
    theMessage.style.fontFamily = 'Macondo'
    popupMessage = new CSS2DObject(theMessage);
    popupMessage.position.set(x,y,z);
    scene.add(popupMessage);
}

/**create diamond and add to scene*/
function createDiamond(){
    //diamond dimensions
    let pos = {x: -5, y: 3, z: 0};
    let scale = {x: 0.5, y: 0.5, z: 0.5};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;    

    //make geometry and material
    const geometry = new THREE.ConeGeometry(2, 5, 6);
    const material = new THREE.MeshStandardMaterial({
        color: 0xf9f9f9,
        metalness: 1,
        roughness:0.5,
        shininess: 50
    });

    //make cone mesh
    cone = new THREE.Mesh(geometry, material);

    //set roation
    cone.rotation.x = Math.PI;

    //make other half of geometry
    const geometryB = new THREE.ConeGeometry(2, 2, 6);
   
    //make cone mesh
    const coneB = new THREE.Mesh(geometryB, material);

    //rotate and position
    coneB.rotation.x = Math.PI;
    coneB.position.y = -3.5;

    //cast shadows
    cone.castShadow = true;
    cone.receiveShadow = true;

    //add cone halves together
    cone.add(coneB);
    
    //scale and position
    cone.position.set(pos.x, pos.y, pos.z);
    cone.scale.set(scale.x, scale.y, scale.z);

    //add to scene
    scene.add(cone);
}

/**create floor and add to scene*/
function createFloor(){
    //world base dimensions
    let pos = {x: 0, y: 0, z: 0};
    let scale = {x: 100, y: 2, z: 100};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //threeJS Section
    const texture = new THREE.TextureLoader().load(['/textures/sand.jpg']);
    let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({map:texture}));
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
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );
    //make collision shape
    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    colShape.setMargin( 0.05 );
    //set inertia
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );
    //make rigid bodies
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );
    //add friction
    body.setFriction(4);
    body.setRollingFriction(10);
    //add to physics world
    physicsWorld.addRigidBody( body );
    body.threeObject = blockPlane;
}

/**create ceiling and add to scene*/
function createCeiling(){
    //world base dimensions
    let pos = {x: 0, y: 25, z: 0};
    let scale = {x: 100, y: 2, z: 100};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //threeJS Section
    const texture = new THREE.TextureLoader().load(['/textures/wall1.jpg']);
    let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({map:texture}));
    //set position and scale
    blockPlane.position.set(pos.x, pos.y, pos.z);
    blockPlane.scale.set(scale.x, scale.y, scale.z);
    //set shadows
    blockPlane.castShadow = true;
    blockPlane.receiveShadow = true;
    //name
    blockPlane.userData.tag = "ceiling";
    //add to world
    scene.add(blockPlane);
}

/**create landing under sarcophagus and add to scene*/
function createLanding(){
   //sarcophagus landing dimensions
   let pos = {x: -24, y: 1, z: 21};
   let scale = {x: 10, y: 1, z: 20};
   let quat = {x: 0, y: 0, z: 0, w: 1};
   let mass = 0; 

   //threeJS Section
   const texture = new THREE.TextureLoader().load(['/textures/gold.jpg']);
   landing = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshLambertMaterial({map: texture}));
   //set position and scale
   landing.position.set(pos.x, pos.y, pos.z);
   landing.scale.set(scale.x, scale.y, scale.z);
   //set shadows
   landing.castShadow = true;
   landing.receiveShadow = true;
   //name
   landing.userData.tag = "landing";
   //add to world
   scene.add(landing);

   //Ammojs Section
   let transform = new Ammo.btTransform();
   transform.setIdentity();
   transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
   transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
   let motionState = new Ammo.btDefaultMotionState( transform );
   //make collision shape
   let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
   colShape.setMargin( 0.05 );
   //set inertia
   let localInertia = new Ammo.btVector3( 0, 0, 0 );
   colShape.calculateLocalInertia( mass, localInertia );
   //make rigid bodies
   let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
   let body = new Ammo.btRigidBody( rbInfo );
   //add friction
   body.setFriction(4);
   body.setRollingFriction(10);
   //add to physics world
   physicsWorld.addRigidBody( body );
   //add userdata
   landing.userData.physicsBody = body;
   body.threeObject = landing;
}

/** load manager */
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

/**create sarcophagus and add to scene*/
function createSarcophagus(){
    //sarcophagus dimensions
    let pos = {x: -24, y: 1, z: 21};
    let scale = {x: 5, y: 5, z: 15};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //load from glb file
    new GLTFLoader(lm()).load('/js/sarcophagus/scene.gltf', function(gltf) {
        let sarco = gltf.scene;
        //add shadows
        sarco.traverse(function (object) {
            if (object.isMesh){
                object.castShadow = true;
            }
        }); 
        
        //set positions
        sarco.scale.set(3,2.5,1.5);
        sarco.rotation.y = Math.PI;
        sarco.rotation.x = Math.PI/2;
        sarco.position.x = -21;
        sarco.position.y = 13;
        sarco.position.z = 19;
        
        //add to scene
        scene.add(sarco);
        //sarcophagus.userData.tag = "sarcophagus";
    });


    //threeJS Section
    sarcophagus = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshLambertMaterial({color: 0xa0afa4}));
    //set position and scale
    sarcophagus.position.set(pos.x, pos.y, pos.z);
    sarcophagus.scale.set(scale.x, scale.y, scale.z);
    //set shadows
    sarcophagus.castShadow = true;
    sarcophagus.receiveShadow = true;
    //name
    sarcophagus.userData.tag = "sarcophagus";
    //add to world
    //scene.add(sarcophagus);

    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );
    //make collision shape
    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    colShape.setMargin( 0.05 );
    //set inertia
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );
    //make rigid bodies
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );
    //add friction
    body.setFriction(4);
    body.setRollingFriction(10);
    //add to physics world
    physicsWorld.addRigidBody( body );
    //add userdata
    sarcophagus.userData.physicsBody = body;
    body.threeObject = sarcophagus;
}

/**create stairs and add to scene*/
function createStairs(){
    //landing dimensions
    let pos = {x: 0, y: 0, z: 0};
    let scale = {x: 5, y: 1, z: 5};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;
    let n = 10;

    //load texture
    const texture = new THREE.TextureLoader().load(['/textures/stair.jpg']);

    //create stair object
    var stairs = new THREE.Object3D();
    for(let i=0;i<n;i+=0.5){
        let x = pos.x;
        let y = pos.y + i;
        let z = pos.z + i;
        //threeJS Section
        let stair = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({map: texture}));
        //set position and scale
        stair.position.set(x,y,z);
        stair.scale.set(scale.x, scale.y, scale.z);
        //set shadows
        stair.castShadow = true;
        stair.receiveShadow = true;
        //name
        stair.userData.tag = "stair "+i.toString;
        //add to world
        stairs.add(stair);

        //Ammojs Section
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( x,y,z) );
        transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
        let motionState = new Ammo.btDefaultMotionState( transform );
        //make collision shape
        let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
        colShape.setMargin( 0.05 );
        //set inertia
        let localInertia = new Ammo.btVector3( 0, 0, 0 );
        colShape.calculateLocalInertia( mass, localInertia );
        //make rigid bodies
        let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
        let body = new Ammo.btRigidBody( rbInfo );
        //add friction
        body.setFriction(4);
        body.setRollingFriction(10);
        //add to physics world
        physicsWorld.addRigidBody( body );
        body.threeObject = stair;
    }
    scene.add(stairs);
}

/**create torches and add to scene*/
function createTorches(){
    //num torches
    let n = 8;
    //collective torch object so i can turn them off
    torches = new THREE.Object3D();
    //array of torch locations
    let torchLocations = [[-7,2.5,0],[-15,-40,3*Math.PI/2],[12.5,-27.5,Math.PI],[20,10,0],[5,30,3*Math.PI/2],[-27.5,-7.5,0],[-15,30,3*Math.PI/2],[-25,5,3*Math.PI/2]];
    for(let i=0;i<n;i++){
        getTorch(torchLocations[i][0],torchLocations[i][1],torchLocations[i][2],);
    }
    scene.add(torches);
}

/**
 * make indivdual torch and add to torch object
 * @param {Int} x - x position for torch to be placed at
 * @param {Int} y - y position for torch to be placed at
 * @param {Int} z - z rotation for torch to be placed at
*/
function getTorch(x,z,r){
    let scale = {x:6,y:6,z:6};
    //load from glb file
    new GLTFLoader().load('/js/torch_stick/scene.gltf', function(gltf) {
        let torch = gltf.scene;
        //add shadows
        torch.traverse(function (object) {
            if (object.isMesh){
                object.castShadow = true;
            }
        }); 
        //scale and place torch
        torch.scale.set(scale.x,scale.y,scale.z)
        torch.rotation.y = r;
        torch.position.x = x;
        torch.position.y = 7;
        torch.position.z = z;
        //add light from torch
        const flame = new THREE.PointLight(0xfda50f);
        flame.intensity = 2;
        flame.distance = 10;
        flame.decay = 2;
        flame.castShadow = true;
        flame.position.x = 0.055;
        flame.position.y = 1.2;
        flame.position.z = -0.055;
        torch.add(flame);
        torches.add(torch);
    });   
}

/**array of maze*/
var amaze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,0,0,0,1,1,1,1,0,1],
    [1,0,0,1,1,1,0,1,1,1,1,1,0,0,0,0,1],
    [1,1,1,1,1,1,0,0,0,0,0,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,0,1,0,1,1,1,1,0,0,1,0,1,1,1,1],
    [1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]];    

/**create maze walls and add to scene*/
function createWalls(){
    //wall dimensions
    let s = 5;
    let pos = {x: 0, y: 12.5, z: 0};
    let scale = {x: s, y: 25, z: s};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    const texture = new THREE.TextureLoader().load(['/textures/stair.jpg']);
    var maze = new THREE.Object3D();
    for(let r=0;r<14;r++){
        for(let c=0;c<17;c++){
            if(amaze[r][c]==1){
                let x = (r-7)*s;
                let y = pos.y;
                let z = (c-8.5)*s;
                //threeJS Section
                let wall = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({map: texture}));
                //position and scale
                wall.position.set(x,y,z);
                wall.scale.set(scale.x, scale.y, scale.z);
                //set shadows
                wall.castShadow = true;
                wall.receiveShadow = true;
                //name wall
                wall.userData.tag = "wall at "+x.toString()+":"+z.toString();
                //add to maze
                maze.add(wall);

                //Ammojs Section
                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin( new Ammo.btVector3(x,y,z) );
                transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
                let motionState = new Ammo.btDefaultMotionState( transform );
                //make collision shape
                let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
                colShape.setMargin( 0.05 );
                //set inertia
                let localInertia = new Ammo.btVector3( 0, 0, 0 );
                colShape.calculateLocalInertia( mass, localInertia );
                //make rigid bodies
                let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
                let body = new Ammo.btRigidBody( rbInfo );
                //add friction
                body.setFriction(4);
                body.setRollingFriction(10);
                //add to physcis world
                physicsWorld.addRigidBody( body );
                //link three and ammo objects
                body.threeObject = wall;
            }
        }
    }
    //add to world
    scene.add(maze);
}

/**create ball and add to scene*/
function createBall(){
    //ball dimensions
    let pos = {x: 0, y: 10, z: 10};
    let radius = 2;
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 1;

    //threeJS Section
    let ball = ballObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({color: 0xff0505}));
    //set positions
    ball.position.set(pos.x, pos.y, pos.z);
    //set shadows
    ball.castShadow = true;
    ball.receiveShadow = true;
    //name ball
    ball.userData.tag = "ball";
    //add to world
    //scene.add(ball);


    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );
    //make collision shape
    let colShape = new Ammo.btSphereShape( radius );
    colShape.setMargin( 0.05 );
    //set inertia
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );
    //make rigid bodies
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );
    //add friction
    body.setFriction(4);
    body.setRollingFriction(10);
    //set activation state
    body.setActivationState( STATE.DISABLE_DEACTIVATION )
    //add to physics world
    physicsWorld.addRigidBody( body );
    //link and start                                          
    ball.userData.physicsBody = body;
    rigidBodies.push(ball);
    body.threeObject = ball;
}

/**create character and add to scene*/
function loadCharacter(){
    //character dimesnions
    let s = 5; 
    let pos = {x: 0, y: 10, z: 10};
    let scale = {x: s, y: s, z: s};

    //load from glb file
    new GLTFLoader(lm()).load('/js/Soldier.glb', function (gltf) {
        model = gltf.scene;
        //add shadows
        model.traverse(function (object) {
            if (object.isMesh){
                object.castShadow = true;
            }
        });
        //set positions
        model.scale.set(scale.x,scale.y,scale.z);
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

/**
 * update character position
 * @param {Int} deltaTime - time change passed for updating physics
*/
function moveCharacter( deltaTime ){
    if(model == null||animationsMap == null||mixer == null){
        return
    }else{
        //move model to match physics object
        let currPosition = ballObject.userData.physicsBody.threeObject.position;
        model.position.x = currPosition.x;
        model.position.y = currPosition.y - 2;
        model.position.z = currPosition.z;

        //switch between animations if moving
        let play = '';
        let fade = 0.2;
        let moveX =  moveDirection.right - moveDirection.left;
        let moveZ =  moveDirection.back - moveDirection.forward;
        let moveY =  0; 
        if( moveX == 0 && moveY == 0 && moveZ == 0){
            play = 'Idle';
        }else{
            play = 'Walk';
        }
        //switch between animations if moving
        if (currentAction != play){
            const toPlay = animationsMap.get(play);
            const current = animationsMap.get(currentAction);
            current.fadeOut(fade);
            toPlay.reset().fadeIn(fade).play();
            currentAction = play;
        }
        mixer.update(deltaTime);
        //update look direction
        if (currentAction == 'Walk'){
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
            moveX = walkDirection.x;
            moveY = 0;
            moveZ = walkDirection.z;
            //result of movement
            let resultantImpulse = new Ammo.btVector3( moveX, moveY, moveZ)
            resultantImpulse.op_mul(velocity);
            //set velocity
            let physicsBody = ballObject.userData.physicsBody;
            physicsBody.setLinearVelocity( resultantImpulse );
        }
    }   
}

/**update camera and cone graphics*/
function updateGraphics(){
    if(controls == null||model == null){
        return;
    }else{
        //check if first person
        if(firstPerson){
            controls.maxPolarAngle = Math.PI;
            controls.minPolarAngle = Math.PI/2;
            controls.minDistance = 0;
            controls.maxDistance = 0.1;
            
        }else{
            controls.maxPolarAngle = Math.PI/2;
            controls.minPolarAngle = 0;
            controls.minDistance = 5;
            controls.maxDistance = 5.1; 
            
        }
        //update camera target
        let headX,headY,headZ
        headX = model.position.x;
        headY = model.position.y + 10;
        headZ = model.position.z;
        cameraTarget.x = headX;
        cameraTarget.y = headY;
        cameraTarget.z = headZ
        controls.target = cameraTarget;
    }
    //rotate diamond cone
    //Diamond
    cone.rotation.x += 0.02;
    cone.rotation.y += 0.02;
    cone.rotation.z += 0.02;
}

/**calculate directional offset of model*/
function directionsOffset(){
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

/**set up contact test*/
function setupContactResultCallback(){
    //create callabck
    cbContactResult = new Ammo.ConcreteContactResultCallback();
    cbContactResult.addSingleResult = function(cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1){
        let contactPoint = Ammo.wrapPointer( cp, Ammo.btManifoldPoint );
        //set distance
        const distance = contactPoint.getDistance();
        //return if not touching anything
        if( distance > 0 ) return;
        //body 1
        let colWrapper0 = Ammo.wrapPointer( colObj0Wrap, Ammo.btCollisionObjectWrapper );
        let rb0 = Ammo.castObject( colWrapper0.getCollisionObject(), Ammo.btRigidBody );
        //body 2
        let colWrapper1 = Ammo.wrapPointer( colObj1Wrap, Ammo.btCollisionObjectWrapper );
        let rb1 = Ammo.castObject( colWrapper1.getCollisionObject(), Ammo.btRigidBody );
        //make objects for bodies
        let threeObject0 = rb0.threeObject;
        let threeObject1 = rb1.threeObject;
        let tag, localPos, worldPos;
        //check for ball
        if( threeObject0.userData.tag != "ball" ){
            //get data
            tag = threeObject0.userData.tag;
            localPos = contactPoint.get_m_localPointA();
            worldPos = contactPoint.get_m_positionWorldOnA();

        }
        else{
            tag = threeObject1.userData.tag;
            localPos = contactPoint.get_m_localPointB();
            worldPos = contactPoint.get_m_positionWorldOnB();
        }
        //output
        let localPosDisplay = {x: localPos.x(), y: localPos.y(), z: localPos.z()};
        let worldPosDisplay = {x: worldPos.x(), y: worldPos.y(), z: worldPos.z()};
        console.log( { tag, localPosDisplay, worldPosDisplay } );
    }

}

/**set up pair contact test*/
function setupContactPairResultCallback(){
    //new callback
    cbContactPairResult = new Ammo.ConcreteContactResultCallback();
    //default is false
    cbContactPairResult.hasContact = false;
    cbContactPairResult.addSingleResult = function(cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1){
        let contactPoint = Ammo.wrapPointer( cp, Ammo.btManifoldPoint );
        //get distance
        const distance = contactPoint.getDistance();
        //if not touching anything then return
        if( distance > 0 ) return;
        //else true
        this.hasContact = true;
    }

}

/**interact with objects in the scene*/
function interact(){
    //default contact is false
    cbContactPairResult.hasContact = false;
    //do contact test
    physicsWorld.contactPairTest(ballObject.userData.physicsBody, sarcophagus.userData.physicsBody, cbContactPairResult);
    physicsWorld.contactPairTest(ballObject.userData.physicsBody, landing.userData.physicsBody, cbContactPairResult);
    //if false return
    if( !cbContactPairResult.hasContact ) return;
    //else win      
        startTimer();
    //add water and make it rise
        addWater();
        waterRising = true;
}

/**check for contact between objects*/
function checkContact(){
    physicsWorld.contactTest( ballObject.userData.physicsBody , cbContactResult );
}

/**
 * update world physics
 * @param {Int} deltaTime - time change passed for updating physics
*/
function updatePhysics( deltaTime ){
    // step world
    physicsWorld.stepSimulation( deltaTime, 10 );
    // update rigid bodies
    for ( let i = 0; i < rigidBodies.length; i++ ) {
        let objThree = rigidBodies[ i ];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if ( ms ) {
            //update objects in motion
            ms.getWorldTransform( tmpTrans );
            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
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
    //console.log("storecount is" + storeCount);
});

//check if player wins or loses*/
function checkWinLose(){

}

/**start and control maze timer */
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
        
        //console.log("storecount is " + countdown)
        var seconds = Math.floor(countdown);

        //displays time left while timer clock is running
        if (clock1.running == true) {
            document.getElementById("timer").innerHTML = "<h1>Time left</h1><div class ='timerSec'>" + seconds + " seconds" + '</div></div>';
        }

        //event that checks if character has intersected with goal point; win condition


        if (Math.abs(model.position.x - cone.position.x) <=1){
            if (Math.abs(model.position.z - cone.position.z) <=1) {
                clearInterval(x);
                location.href = '../level transitioning/endGame.html'
            }
        }                       
            // display a message when the countdown is over
            if (storeCount < 0 || countdown < 0) {
                clearInterval(x);
                //document.getElementById("timer").innerHTML = "<h1>TIME'S UP!</h1>";
                location.href ='../level transitioning/timeRunOut3.html'
            }


        }, 1000);

        console.log("countdown in timer is " + countdown)
}
