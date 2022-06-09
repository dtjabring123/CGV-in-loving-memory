
// 1. Create the button for replaying
var replayButton = document.createElement("button");
replayButton.style.position = "absolute";
replayButton.style.top = "30%"; 
replayButton.style.left = "0%";
replayButton.style.zIndex='3';
replayButton.style.fontSize = "20px"
replayButton.innerHTML = "REPLAY LEVEL"; //text inside button

// 2. Append to body
var body = document.getElementsByTagName("body")[0];
body.appendChild(replayButton);

// 3. Transition to level 3
replayButton.addEventListener ("click", function() {
location.href = "../level1/level1.html";
});


// 1. Create the button to go back to main menu
var menuButton = document.createElement("button");
menuButton.style.position = "absolute";
menuButton.style.left = "0%";
menuButton.style.top = "60%"; //move under replay button
menuButton.style.fontSize = "17px" 
menuButton.style.zIndex='3';
menuButton.innerHTML = "RETURN TO MAIN MENU"; 

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(menuButton);

// 3. Add transition to main menu
menuButton.addEventListener ("click", function() {
location.href='../menu/menu.html'
    
});

//level failed message
var levelFailed = document.createElement("h1");
levelFailed.style.position = "absolute";
levelFailed.style.top = "-5%"; //move above
levelFailed.innerHTML = "Level failed!";
body.appendChild(levelFailed);

//oh well message
var ohWell = document.createElement("h1");
ohWell.innerHTML = "You didn't make it out in time..";
ohWell.style.top = "20%"; //move below
ohWell.style.fontSize = "60px";
body.appendChild(ohWell);

//congrats message
var congrats = document.createElement("h1");
congrats.innerHTML = "Try harder next time!";
congrats.style.position = "absolute";
congrats.style.top = "35%"; //move below
congrats.style.fontSize = "60px";
body.appendChild(congrats);

//adding stars to background
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

