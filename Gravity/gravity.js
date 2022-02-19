var canvas = document.getElementById("sim")
var context = canvas.getContext("2d")

const width = 600
const height = 600

const background = "#000000"

canvas.width = width
canvas.height = height

const G = 0.25

class Vector2 {
    x = 0
    y = 0

    constructor(x, y) {
        this.x = x || 0
        this.y = y || 0
    }

    static distance(vec1, vec2) {
        return Math.sqrt(Math.pow(Math.abs(vec1.x - vec2.x), 2) + Math.pow(Math.abs(vec1.y - vec2.y), 2))
    }
}

class Planet {
    position = new Vector2(0, 0)
    scale = 1

    mass = 1
    velocity = new Vector2(0, 0)
    isStatic = false

    color = "#ffffff"

    constructor(position, scale, isStatic, color) {
        this.position = position || new Vector2(0, 0)
        this.scale = scale || 1

        this.mass = (scale / 2) || 1
        this.velocity = new Vector2(0, 0)
        this.isStatic = isStatic || false

        this.color = color || "#ffffff"
    }

    static isColliding(planet1, planet2) {
        return Vector2.distance(planet1.position, planet2.position) <= Math.max(planet1.scale, planet2.scale) * 1.5
    }
}

var planets = []

for (var i = 0; i < 50; i++) {
    var planet = new Planet(new Vector2(Math.random() * width, Math.random() * height), 1 + Math.floor(Math.random() * 5))
    planets.push(planet)
}

function render() {
    context.beginPath()
    context.fillStyle = background
    context.rect(0, 0, width, height)
    context.fill()
    context.closePath()

    planets.forEach(planet => {
        context.beginPath()
        context.fillStyle = planet.color
        context.arc((planet.position.x) - (planet.scale / 2), (planet.position.y) - (planet.scale / 2), planet.scale, 0, Math.PI * 2);
        context.fill()
        context.closePath()
    })

    requestAnimationFrame(render)
}

var lastupdate = 0
function update(delta) {
    planets.forEach(planet => {
        if (planet.isStatic) return

        planets.forEach(planet2 => {
            if (planet2 == planet) return

            // if (Planet.isColliding(planet, planet2)) {
            //     if (planet.mass < planet2.mass) {
            //         planets.splice(planets.indexOf(planet), 1)
            //     } else if (planet2.mass < planet.mass) {
            //         planets.splice(planets.indexOf(planet2), 1)
            //     } else {
            //         planets.splice(planets.indexOf(planet), 1)
            //         planets.splice(planets.indexOf(planet2), 1)
            //     }
            // }

            planet.velocity.x += (((planet.position.x - planet2.position.x) / Vector2.distance(planet.position, planet2.position)) * G) / (planet.mass / planet2.mass)
            planet.velocity.y += (((planet.position.y - planet2.position.y) / Vector2.distance(planet.position, planet2.position)) * G) / (planet.mass / planet2.mass)

            planet2.velocity.x += (((planet2.position.x - planet.position.x) / Vector2.distance(planet2.position, planet.position)) * G) / (planet2.mass / planet.mass)
            planet2.velocity.y += (((planet2.position.y - planet.position.y) / Vector2.distance(planet2.position, planet.position)) * G) / (planet2.mass / planet.mass)
        })

        planet.position.x -= planet.velocity.x * delta
        planet.position.y -= planet.velocity.y * delta
    })

    requestAnimationFrame(t => {
        var delta = (t - lastupdate) / 1000
        lastupdate = t
        update(delta)
    })
}

update(0)
render()