var body = document.getElementsByTagName("body")[0];

document.body.style.backgroundColor = '#000000'; //setting backgound colour
var ht = 12;

//adding stars to the background
const stars = 400

for (let i = 0; i < stars; i++) {
    let star = document.createElement("div")
    star.className = 'stars'
    var xy = randomPosition();
    star.style.top = xy[0] + 'px'
    star.style.left = xy[1] + 'px'

    document.body.append(star)
}

function randomPosition() {
    var y = body.offsetWidth;
    var x = body.offsetHeight;
    var randomX = Math.floor(Math.random() * x)
    var randomY = Math.floor(Math.random() * y)
    return [randomX, randomY]
}
