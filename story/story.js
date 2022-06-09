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
// 1. Create the button
let musicButton = document.createElement("div");
musicButton.className='button'
musicButton.style.top = 20+ 'px'
musicButton.style.left = 20 + 'px'
musicButton.style.zIndex=5;
document.body.append(musicButton);