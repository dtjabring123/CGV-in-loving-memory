var body = document.getElementsByTagName("body")[0];

//add a heading for the credits page
var credits = document.createElement("h1");
credits.innerHTML = "CREDITS";
credits.style.position = "absolute";
credits.style.top = "-5%"; //move below
credits.style.fontSize = "80px";
credits.style.alignSelf="center";
body.appendChild(credits);

document.body.style.backgroundColor = '#e4d9c9'; //setting backgound colour
var ht = 12;

//models heading
var mod = document.createElement("h2");
mod.innerHTML = "MODELS AND OBJECTS";
mod.style.position = "absolute";
mod.style.top = ht+"%"; //move below
//mod.style.left = "-36%"; //move left
mod.style.fontSize = "40px";
body.appendChild(mod);

//heading music
var music = document.createElement("h2");
music.innerHTML = "SOUND EFFECTS AND MUSIC";
music.style.position = "absolute";
music.style.top = ht + 15 +"%"; //move below
//music.style.left = "-32%"; //move below
music.style.fontSize = "40px";
body.appendChild(music);

//heading miscellaneous
var misc = document.createElement("h2");
misc.innerHTML = "MISCELLANEOUS";
misc.style.position = "absolute";
misc.style.top = ht + 40+"%"; //move below
//misc.style.left = "-39%"; //move below
misc.style.fontSize = "40px";
body.appendChild(misc);

//source 1 eric matyas
var eric = document.createElement("body");
eric.innerHTML = "Music by Eric Matayas";
eric.style.position = "absolute"
eric.style.top = ht +23+ "%"; //move below
//eric.style.left = "-40%"; //move below
eric.style.fontSize = "30px";
body.appendChild(eric);


//make it clickable to send them to his website
eric.addEventListener ("click", function() {
    window.location.assign("https://soundimage.org/");
    });

//heading images
var pics = document.createElement("h2");
pics.innerHTML = "IMAGES AND TEXTURES";
pics.style.position = "absolute";
pics.style.top = "38%"; //move below
//pics.style.left = "-35%"; //move below
pics.style.fontSize = "40px";
body.appendChild(pics);

//source 1 open game art 
var tex = document.createElement("body");
tex.innerHTML = "Textures from Open Game Art";
tex.style.position = "absolute"
tex.style.top = "45%"; //move below
//tex.style.left = "-37%"; //move below
tex.style.fontSize = "30px";
tex.style.textAlign="center";
body.appendChild(tex);

//make it clickable to send them to his website
tex.addEventListener ("click", function() {
    window.location.assign("https://OpenGameArt.org/");
    });

//source 2 
var texMap = document.createElement("body");
texMap.innerHTML = "Texture Mapping";
texMap.style.position = "absolute"
texMap.style.top = "49%"; //move below
//texMap.style.left = "-42%"; //move below
texMap.style.fontSize = "30px";
body.appendChild(texMap);

//make it clickable to send them to his website
texMap.addEventListener ("click", function() {
    window.location.assign("https://www.youtube.com/watch?v=thVl4UOQSEM&t=186s");
    });

// models source 1 
var sf = document.createElement("body");
sf.innerHTML = "Objects from Sketchfab";
sf.style.position = "absolute"
sf.style.top = ht + 8 +"%"; //move below
sf.style.left = "40%"; //move below
sf.style.fontSize = "30px";
body.appendChild(sf);

//make it clickable to send them to his website
sf.addEventListener ("click", function() {
    window.location.assign("https://sketchfab.com/feed");
    });

// models source 2
var ts = document.createElement("body");
ts.innerHTML = "Objects from Turbo Squid";
ts.style.position = "absolute"
ts.style.top = ht +12+"%"; //move below
//ts.style.left = "-39%"; //move below
ts.style.fontSize = "30px";
body.appendChild(ts);

//make it clickable to send them to his website
ts.addEventListener ("click", function() {
    window.location.assign("https://www.turbosquid.com");
    });

//miscellaneous

//star wars title screen
var starwars = document.createElement("body");
starwars.innerHTML = "Star Wars title screen";
starwars.style.position = "absolute"
starwars.style.top = ht +48+"%"; //move below
//starwars.style.left = "-41%"; //move below
starwars.style.fontSize = "30px";
body.appendChild(starwars);

//make it clickable to send them to his website
starwars.addEventListener ("click", function() {
    window.location.assign("https://github.com/thedevdrawer/star-wars-intro/");
    });

//loading bar 
var loadingBar = document.createElement("body");
loadingBar.innerHTML = "Loading bar";
loadingBar.style.position = "absolute"
loadingBar.style.top = ht +51+"%"; //move below
//loadingBar.style.left = "-44%"; //move below
loadingBar.style.fontSize = "30px";
body.appendChild(loadingBar);

//make it clickable to send them to his website
loadingBar.addEventListener ("click", function() {
    window.location.assign("https://www.youtube.com/watch?v=zMzuPIiznQ4");
    });

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