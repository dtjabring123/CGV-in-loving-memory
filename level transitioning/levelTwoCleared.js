
// 1. Create the button
//play next level
var nextLevel = document.createElement("button");
nextLevel.style.position = "absolute";
nextLevel.style.top = "0%";
nextLevel.style.left = "0%";
nextLevel.style.fontSize = "20px";
nextLevel.style.zIndex='3';
nextLevel.innerHTML = "PLAY NEXT LEVEL";

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(nextLevel);

// 3. Add event handler
nextLevel.addEventListener ("click", function() {
    location.href="../level3/level3.html";
});


// 1. Create the button for replaying
var replayButton = document.createElement("button");
replayButton.style.position = "absolute";
replayButton.style.top = "30%"; //move below first button
replayButton.style.left = "0%";
replayButton.style.fontSize = "20px";
replayButton.style.zIndex='3';
replayButton.innerHTML = "REPLAY LEVEL"; //text

// 2. Append to the body
body.appendChild(replayButton);

// 3. Add transition to level 2
replayButton.addEventListener ("click", function() {
    location.href="../level2/level2.html";
});


// 1. Create the button to go back to main menu
var menuButton = document.createElement("button");
menuButton.style.position = "absolute";
menuButton.style.left = "0%";
menuButton.style.top = "60%"; //move under 2nd button
menuButton.style.fontSize = "17px" //set size text
menuButton.style.zIndex='3';
menuButton.innerHTML = "RETURN TO MAIN MENU"; ///text

// 2. Append to body
body.appendChild(menuButton);

// 3. Add transition to main menu page
menuButton.addEventListener ("click", function() {
    location.href='../menu/menu.html'
});

//level cleared message
var levelClear = document.createElement("h1");
levelClear.style.position = "absolute";
levelClear.style.top = "-5%"; //move above
levelClear.innerHTML = "Level 2 cleared!";
body.appendChild(levelClear);

//congrats message
var congrats = document.createElement("h1");
congrats.innerHTML = "You've unlocked the next leg of your journey..";
congrats.style.position = "absolute";
congrats.style.top = "15%"; //move below
congrats.style.fontSize = "60px";
body.appendChild(congrats);

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