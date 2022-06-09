import * as THREE from '/js/three.module.js';
import {OrbitControls} from "/js/OrbitControls.js"
import {GLTFLoader} from "/js/GLTFLoader.js";
import {Sky} from './Sky.js';

//variable declaration section
let controls, clock, physicsWorld, scene, camera, renderer, rigidBodies = [], tmpTrans = null
let kObject = null,ballObject = null, moveDirection = { left: 0, right: 0, forward: 0, back: 0 }
let cbContactResult, tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();
let ammoTmpPos = null, ammoTmpQuat = null,cbContactPairResult;
let model = null,mixer = null,animationsMap = null,currentAction,cameraTarget=null;
let walkDirection = null, rotateAngle = null, rotateQuarternion = null, velocity;
var firstPerson = false;
let dirLight;
let diamond, baseA, baseB;
let coyotee, treasureA, traesure2A; //for the collision detection 

const STATE = { DISABLE_DEACTIVATION : 4 }

//initialise ammo
Ammo().then(start)

//start/init function
function start (){
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
    setupContactPairResultCallback();
    setupEventHandlers();

    //run graphics
    renderFrame();

    //objects 
    createCoyotee();
    treasureChest();
    treasureBase();
    treasureChest2();
    treasureBase2();

    oakTrees(-96.8,-3,-145.7,7);
    oakTrees(-45,-3,151,5);

    //mushrooms();
    mushrooms(117.6,1,-157.49,50);
    mushrooms(-149.5,1,133.3,30);
    mushrooms(147.8,1,134,50);
    mushrooms(-134.3,1,-146.3,60);
    mushrooms (-110,1,-146.3,35);

}

//set up worlds physics
function setupPhysicsWorld(){
    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}

//set up worlds graphics
function setupGraphics(){
    //create clock for timing
    clock = new THREE.Clock();

    //create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfd1e5 );

    //create camera                                     camera ratio 
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1000 );  //( 60, window.innerWidth / window.innerHeight, 0.2, 1000 ) 
    camera.position.set(0,200,0);

    //add hemisphere light
    let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
    hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
    hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
    hemiLight.position.set( 0, 50, 0 );
    scene.add( hemiLight );

    //add directional light
    dirLight = new THREE.DirectionalLight( 0xffffff , 1);
    dirLight.color.setHSL( 0.1, 1, 0.95 );
   
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 9000;
    dirLight.shadow.mapSize.height = 9000;
    let d = 75;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 13500;
    scene.add( dirLight );

    //setup the renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0xbfd1e5 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;

    //add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;

    //Dynamic SkyBox
    initSky();

    //diamond
    diamond = getDiamond(0);
    diamond.scale.set(0.8, 0.8, 0.8);
    diamond.position.set(106,5,135);
    scene.add(diamond);
}

//render frame
function renderFrame(){
    let deltaTime = clock.getDelta();
    
    //update objects
    updatePhysics( deltaTime );
    moveCharacter( deltaTime );
    updateCamera();

    //update camera
    controls.update();

    //Dynamic SkyBox
    timeElapsed = clock1.getElapsedTime();
    phi = timeElapsed * 0.03* Math.PI - Math.PI/2;

    sun.setFromSphericalCoords( 1, phi, theta );

    dirLight.position.setFromSphericalCoords(1, phi, theta);
    uniforms[ 'sunPosition' ].value.copy( sun );

    //diamond
    diamond.rotation.x += 0.02;
    diamond.rotation.y -= 0.02;
    diamond.rotation.z += 0.02;

    //render updates
    renderer.render( scene, camera );
    requestAnimationFrame( renderFrame );
}

//setup event handlers
function setupEventHandlers(){
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'keydown', handleKeyDown, false);
    window.addEventListener( 'keyup', handleKeyUp, false);
}

//resize window
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

//Dynamic skyBox
var clock1 = new THREE.Clock();
var timeElapsed;

var uniforms;
let sky, sun;
var phi;
var theta = 0;

function initSky() {

    // Add Sky
    sky = new Sky();
    sky.scale.setScalar( 450000 );
    scene.add( sky );

    sun = new THREE.Vector3();

    
    uniforms = sky.material.uniforms;
    uniforms[ 'turbidity' ].value = 1;
    uniforms[ 'rayleigh' ].value = 0.5;
    uniforms[ 'mieCoefficient' ].value = 0.1;
    uniforms[ 'mieDirectionalG' ].value = 1;

    renderer.toneMappingExposure = 0.1;
    renderer.render( scene, camera );
}

function getDiamond(){
    const geometry = new THREE.ConeGeometry(2, 5, 6);
    const material = new THREE.MeshPhongMaterial({
        color: 0xae8625,
        metalness: 1,
        roughness:0.5,
        shininess: 50
    });
    const cone = new THREE.Mesh(geometry, material);

    cone.rotation.x = Math.PI;

    const geometryB = new THREE.ConeGeometry(2, 2, 6);
    const materialB = new THREE.MeshStandardMaterial({
        color: 0xae8625,
        metalness: 1,
        roughness:0.5,
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

//handle keypresses
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
        case 17:
            firstPerson = !firstPerson;
            break;
    }
}

//handle keypresses
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

//getting the objects 

//coyotee
function createCoyotee(){
    //objects dimensions
    let pos = {x: -103.9, y: 1, z:-10.4};
    let scale = {x: 10, y: 5, z: 5};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //load from glb file
    new GLTFLoader().load('../coyotee_statue/scene.gltf', function(gltf) {
        let coyoteeStatue = gltf.scene;
        //add shadows
        coyoteeStatue.traverse(function (object) {
            if (object.isMesh){
                object.castShadow = true;
            }
        }); 
        
        //set positions
        coyoteeStatue.scale.set(1.5,1.5,1.5);
        coyoteeStatue.rotation.y = -Math.PI/2;
        //coyoteeStatue.rotation.x = Math.PI/2;
        coyoteeStatue.position.x = -101.9;
        coyoteeStatue.position.y = 1;
        coyoteeStatue.position.z = -10.4;
        
        //add to scene
        scene.add(coyoteeStatue);
        //coyotee.userData.tag = "coyotee";
    });    

    //threeJS Section (so that you can see what the ammo is doing)
    coyotee = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshLambertMaterial({color: 0xa0afa4}));
    //set position and scale
    coyotee.position.set(pos.x, pos.y, pos.z);
    coyotee.scale.set(scale.x, scale.y, scale.z);
    //set shadows
    coyotee.castShadow = true;
    coyotee.receiveShadow = true;
    //name
    coyotee.userData.tag = "coyotee";
    //add to world
    //scene.add(coyotee);

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
    coyotee.userData.physicsBody = body;
    body.threeObject = coyotee;
    
}


//treasure chest (6 boxes)
function treasureChest(){
    //objects dimensions
    let pos = {x: 14.94, y: 2, z:20};
    let scale = {x: 4, y: 5, z: 30};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //load from glb file
    new GLTFLoader().load('./wood_boxes.gltf/wood boxes.glb', function(gltf) {
        let treasure = gltf.scene;
        //add shadows
        treasure.traverse(function (object) {
            if (object.isMesh){
                object.castShadow = true;
            }
        }); 
        
        //set positions
        treasure.scale.set(5,5,5);
        treasure.position.x = 14.94;
        treasure.position.y = 2;
        treasure.position.z = 24;
        console.log()
        //add to scene
        scene.add(treasure);
        //treasure.userData.tag = "treasure";
    });    

    //threeJS Section
    treasureA = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshLambertMaterial({color: 0xa0afa4}));
    //set position and scale
    treasureA.position.set(pos.x, pos.y, pos.z);
    treasureA.scale.set(scale.x, scale.y, scale.z);
    //set shadows
    treasureA.castShadow = true;
    treasureA.receiveShadow = true;
    //name
    treasureA.userData.tag = "treasureA";
    //add to world
    //scene.add(treasureA);

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
    treasureA.userData.physicsBody = body;
    body.threeObject = treasureA;
}

//make base for 6 boxes
function treasureBase(){
    //objects dimensions
    let pos = {x: 14.94, y: 1, z:20};
    let scale = {x: 6, y: 1, z: 34};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //threeJS Section
    baseA = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshLambertMaterial({color: 0xa0afa4}));
    //set position and scale
    baseA.position.set(pos.x, pos.y, pos.z);
    baseA.scale.set(scale.x, scale.y, scale.z);
    //set shadows
    baseA.castShadow = true;
    baseA.receiveShadow = true;
    //name
    baseA.userData.tag = "baseA";
    //add to world
    scene.add(baseA);

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
    baseA.userData.physicsBody = body;
    body.threeObject = baseA;
}

//single treasure chest 
function treasureChest2(){
    //objects dimensions
    let pos = {x: -67, y: 2, z:-89};
    let scale = {x: 6, y: 5, z: 10};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //load from glb file
    new GLTFLoader().load('../treasure_chest/scene.gltf', function(gltf) {
        let treasure2 = gltf.scene;
        //add shadows
        treasure2.traverse(function (object) {
            if (object.isMesh){
                object.castShadow = true;
            }
        }); 
        
        //set positions
        treasure2.scale.set(0.1,0.1,0.1);
        treasure2.position.x = -67;
        treasure2.position.y = 2;
        treasure2.position.z = -89;
        
        //add to scene
        scene.add(treasure2);
        //treasure2.userData.tag = "treasure2";
    });    

    //threeJS Section
    let treasure2A = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshLambertMaterial({color: 0xa0afa4}));
    //set position and scale
    treasure2A.position.set(pos.x, pos.y, pos.z);
    treasure2A.scale.set(scale.x, scale.y, scale.z);
    //set shadows
    treasure2A.castShadow = true;
    treasure2A.receiveShadow = true;
    //name
    treasure2A.userData.tag = "treasure2A";
    //add to world
    //scene.add(treasure2A);

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
    treasure2A.userData.physicsBody = body;
    body.threeObject = treasure2A;
}

//create treasure base 2
function treasureBase2(){
    //objects dimensions
    let pos = {x: -67, y: 1, z:-89};
    let scale = {x: 10, y: 1, z: 14};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;    

    //threeJS Section
    baseB = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshLambertMaterial({color: 0xa0afa4}));
    //set position and scale
    baseB.position.set(pos.x, pos.y, pos.z);
    baseB.scale.set(scale.x, scale.y, scale.z);
    //set shadows
    baseB.castShadow = true;
    baseB.receiveShadow = true;
    //name
    baseB.userData.tag = "baseB";
    //add to world
    scene.add(baseB);

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
    baseB.userData.physicsBody = body;
    body.threeObject = baseB;
}

//
function oakTrees(a,b,c,d){

    //objects dimensions
    let pos = {x: a, y: b, z:c};
    let scale = {x: d, y: d, z: d};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //load from glb file
    new GLTFLoader().load('../oakTrees/scene.gltf', function(gltf) {
        let oak = gltf.scene;
        //add shadows
        oak.traverse(function (object) {
            if (object.isMesh){
                object.castShadow = true;
            }
        }); 
        
        //set positions
        oak.scale.set(scale.x,scale.y,scale.z);
        oak.position.x = pos.x;
        oak.position.y = pos.y;
        oak.position.z = pos.z;
        
        //add to scene
        scene.add(oak);
        //sarcophagus.userData.tag = "sarcophagus";
    });    
}

//mushrooms made in blender    (117.6,1,-157.49)
function mushrooms(a,b,c,d){
    //objects dimensions
    let pos = {x: a, y: b, z:c};
    let scale = {x: d, y: d, z: d};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //load from glb file
    new GLTFLoader().load('../mushroom/mushroom.glb', function(gltf) {
        let mushroom = gltf.scene;
        //add shadows
        mushroom.traverse(function (object) {
            if (object.isMesh){
                object.castShadow = true;
            }
        }); 
        
        //set positions
        mushroom.scale.set(scale.x,scale.y,scale.z);
        mushroom.position.x = pos.x;
        mushroom.position.y = pos.y;
        mushroom.position.z = pos.z;

        scene.add(mushroom);
        //sarcophagus.userData.tag = "sarcophagus";
    });    

}

//create world base
function createBlock(){
    //world base dimensions
    let pos = {x: 0, y: 0, z: 0};
    let scale = {x: 400, y: 2, z: 400};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    //threeJS Section
    let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: "#dddddd"}));     //0xa0afa4
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

//array of maze
var amaze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,1,1,1,0,0,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,0,1],
        [1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,1],
        [1,0,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,0,1],
        [1,0,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,0,1,0,0,1],
        [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,1,1,1],
        [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,0,1],
        [1,0,1,1,0,1,0,1,0,1,1,1,1,0,1,0,0,1,0,1,0,1,0,0,1],
        [1,0,0,1,0,1,0,0,0,1,0,0,1,0,1,0,0,0,0,1,0,1,0,0,1],
        [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,0,0,1],
        [1,0,1,0,0,0,0,1,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,0,1],		
        [1,0,1,0,0,0,0,1,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1],	
        [1,1,1,1,1,1,1,1,1,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,1],	
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],	
        [1,1,1,1,1,1,1,0,1,1,1,1,0,1,0,1,0,0,0,0,0,0,0,0,1],	
        [1,0,0,0,0,0,1,0,0,0,0,1,0,1,1,1,0,1,1,1,1,1,1,0,1],	
        [1,0,0,1,1,1,1,0,1,1,0,1,0,0,0,0,0,1,0,0,0,0,1,0,1],	
        [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,1,1,0,1,0,1],	
        [1,1,1,1,1,1,0,0,1,0,0,1,1,1,1,1,1,1,0,0,1,0,1,0,1],	
        [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],	
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]	
      ];

//create maze walls
function createWalls(){
    //wall dimensions
    let s = 10;
    let pos = {x: 0, y: 2.5, z: 0};
    let scale = {x: s, y: 15, z: s};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass = 0;

    
    var maze = new THREE.Object3D();
    for(let r=0;r<25;r++){
        for(let c=0;c<25;c++){
            if(amaze[r][c]==1){
                let x = (r-12.5)*s;
                let y = pos.y;
                let z = (c-12.5)*s;
                //threeJS Section

                const texture = new THREE.TextureLoader().load(["white_walls.png"]);
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

//create ball
function createBall(){
    //ball dimensions
    let pos = {x: 0, y: 4, z: 0};
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

//create dude
function loadCharacter(){
    //character dimesnions
    let s = 5; 
    let pos = {x: -97.8, y: 1, z: -114.6};
    let scale = {x: s, y: s, z: s};

    //load from glb file
    new GLTFLoader().load('/js/Soldier.glb', function (gltf) {
        model = gltf.scene;
        //add shadows
        model.traverse(function (object) {
            if (object.isMesh){
                object.castShadow = true;
            }
        });
        //set positions
        model.scale.set(scale.x,scale.y,scale.z);
        model.position.x = -97.8;
        model.position.y = 1;
        model.position.z =-114.6;
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
function moveCharacter( deltaTime ){
    if(model == null||animationsMap == null||mixer == null){
        return
    }else{
        //move model to match physics object
        let currPosition = ballObject.userData.physicsBody.threeObject.position;
        model.position.x = currPosition.x;
        //model.position.y = currPosition.y;
        model.position.z = currPosition.z;


        //#########################################
        //console.log(model.position);
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
            const moveX = walkDirection.x;
            const moveY = 0;
            const moveZ = walkDirection.z;
            //result of movement
            let resultantImpulse = new Ammo.btVector3( moveX, moveY, moveZ)
            resultantImpulse.op_mul(velocity);
            //set velocity
            let physicsBody = ballObject.userData.physicsBody;
            physicsBody.setLinearVelocity( resultantImpulse );
        }
    }   
}

//update camera
function updateCamera(){
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
            controls.minDistance = 110;  //30
            controls.maxDistance = 110.1; //30.1
        }
        //update camera target
        cameraTarget.x = model.position.x;
        cameraTarget.y = model.position.y + 10;
        cameraTarget.z = model.position.z;
        controls.target = cameraTarget;
    }
}

//calculate directional offset
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

//contact test
function setupContactResultCallback(){
    //create callabck
    cbContactResult = new Ammo.ConcreteContactResultCallback();
    
    cbContactResult.addSingleResult = function(cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1){
        
        let contactPoint = Ammo.wrapPointer( cp, Ammo.btManifoldPoint );

        const distance = contactPoint.getDistance();

        if( distance > 0 ) return;

        let colWrapper0 = Ammo.wrapPointer( colObj0Wrap, Ammo.btCollisionObjectWrapper );
        let rb0 = Ammo.castObject( colWrapper0.getCollisionObject(), Ammo.btRigidBody );
        
        let colWrapper1 = Ammo.wrapPointer( colObj1Wrap, Ammo.btCollisionObjectWrapper );
        let rb1 = Ammo.castObject( colWrapper1.getCollisionObject(), Ammo.btRigidBody );

        let threeObject0 = rb0.threeObject;
        let threeObject1 = rb1.threeObject;

        let tag, localPos, worldPos

        if( threeObject0.userData.tag != "ball" ){

            tag = threeObject0.userData.tag;
            localPos = contactPoint.get_m_localPointA();
            worldPos = contactPoint.get_m_positionWorldOnA();

        }
        else{

            tag = threeObject1.userData.tag;
            localPos = contactPoint.get_m_localPointB();
            worldPos = contactPoint.get_m_positionWorldOnB();

        }
        
        let localPosDisplay = {x: localPos.x(), y: localPos.y(), z: localPos.z()};
        let worldPosDisplay = {x: worldPos.x(), y: worldPos.y(), z: worldPos.z()};

        console.log( { tag, localPosDisplay, worldPosDisplay } );
        
    }

}

//check for contact
function checkContact(){
    physicsWorld.contactTest( ballObject.userData.physicsBody , cbContactResult );
}

//pair contact test
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

//interact with things in the scene
function interact(){
    //default contact is false
    cbContactPairResult.hasContact = false;
    //do contact test for group of chests
    physicsWorld.contactPairTest(ballObject.userData.physicsBody, baseB.userData.physicsBody, cbContactPairResult);
    //check contact and act
    if( !cbContactPairResult.hasContact ){
        console.log('touching group of chests');    
    }
    
    //default contact is false
    cbContactPairResult.hasContact = false;
    //do contact test for group of chests
    physicsWorld.contactPairTest(ballObject.userData.physicsBody, baseA.userData.physicsBody, cbContactPairResult);
    //check contact and act
    if( !cbContactPairResult.hasContact ){
        console.log('touching chest');    
    }
}

//update physics
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

