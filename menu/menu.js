

import * as THREE from "../js/three.module.js";
var midh = window.innerHeight/2  -70;
var midw = window.innerWidth/2-60;
var midhB1 = window.innerHeight/2 +20;
midh = midh+"px";
midw = midw+"px";
midhB1 = midhB1 +"px";

// 1. Create the button
var startButton = document.createElement("button");
startButton.style.position = "absolute";
startButton.style.left =midw;
startButton.style.top =midh;
startButton.innerHTML = "START";

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(startButton);

// 3. Add event handler
startButton.addEventListener ("click", function() {
   location.href="../level1/level1.html"
});

// 1. Create the button
var creditsButton = document.createElement("button");
creditsButton.style.position = "absolute";
creditsButton.style.left = midw;
creditsButton.style.top = midhB1;
creditsButton.innerHTML = "CREDITS";

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(creditsButton);

// 3. Add event handler
creditsButton.addEventListener ("click", function() {
    // changeLevel(3); //this is where we put code to say move to main.js !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    location.href = "credits.html"
});

//instructions 
var instr = document.createElement("caption");
instr.innerHTML = "To move the view, use your mouse. To move the character, use WASD. Look for the treasure to pass the level!"
body.appendChild(instr);
//writing game name
var nameGame = document.createElement("h1");
nameGame.innerHTML = "In Loving Memory...";
body.appendChild(nameGame);


//adding stars to the background
const stars = 400

for (let i =0; i < stars; i++) {
    let star = document.createElement("div")
    star.className = 'stars'
    var xy = randomPosition();
    star.style.top = xy[0] + 'px'
    star.style.left = xy[1] + 'px'
    
    document.body.append(star)
}

function randomPosition() {
    var y = window.innerWidth
    var x = window.innerHeight
    var randomX = Math.floor(Math.random() * x)
    var randomY = Math.floor(Math.random() * y)
    return [randomX, randomY]
}