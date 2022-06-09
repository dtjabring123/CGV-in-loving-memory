
// 1. Create the button
//play next level
var button = document.createElement("button");
button.style.position = "absolute";
button.style.top = "-20%";
button.style.left = "0%";
button.style.fontSize = "20px"
button.innerHTML = "REPLAY LEVEL 1";

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(button);

// 3. Add event handler
button.addEventListener ("click", function() {
console.log("start switch") //this is where we put code to say move to next leveljs !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
});


// 1. Create the button for replaying
var button3 = document.createElement("button");
button3.style.position = "absolute";
button3.style.top = "5%"; //move below first button
button3.style.left = "0%";
button3.style.fontSize = "20px"
button3.innerHTML = "REPLAY LEVEL 3"; //text

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(button3);

// 3. Add event handler
button.addEventListener ("click", function() {
console.log("replay level 3") //this is where we put code to say restart this level js !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
});

// 1. Create the button for replaying
var button2 = document.createElement("button");
button2.style.position = "absolute";
button2.style.top = "30%"; //move below first button
button2.style.left = "0%";
button2.style.fontSize = "20px"
button2.innerHTML = "REPLAY LEVEL 3"; //text

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(button2);

// 3. Add event handler
button.addEventListener ("click", function() {
console.log("replay level") //this is where we put code to say restart this level js !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
});


// 1. Create the button to go back to main menu
var button1 = document.createElement("button");
button1.style.position = "absolute";
button1.style.left = "0%";
button1.style.top = "55%"; //move under 2nd button
button1.style.fontSize = "17px" //set size text
button1.innerHTML = "RETURN TO MAIN MENU"; ///text

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(button1);
// 3. Add event handler
button1.addEventListener ("click", function() {
     console.log("credits switch") //this is where we put code to say move to main menue .js !!!!!!!!!!!!!!!!!!!!!!!!!!!!!
});


//instructions 
var instr = document.createElement("caption");
instr.style.fontSize = "25px";
instr.innerHTML = "Use your mouse to change the view. Use WASD to move the character. Look for the treasure to escape the maze before time runs out."
body.appendChild(instr);
//writing game name
var nameGame = document.createElement("h1");
nameGame.style.position = "absolute";
nameGame.style.top = "-5%"; //move above
nameGame.innerHTML = "You found the treasure!";
body.appendChild(nameGame);
//writing game name
var slow = document.createElement("h1");
slow.innerHTML = "Congratulations, you've completed all levels.";
slow.style.position = "absolute";
slow.style.top = "10%"; //move below
slow.style.fontSize = "80px";
body.appendChild(slow);



//
document.body.style.backgroundColor = '#8FBFA8';
