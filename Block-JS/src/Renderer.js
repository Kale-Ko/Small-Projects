const Renderer = class Renderer {
    instance

    canvas
    properties

    constructor(instance, id = Math.round(Math.random() * 2048), width = 800, height = 600, parent = document.body) {
        if (instance === null || instance === undefined || typeof instance !== "object") {
            throw new Error("Parameter \"instance\" cant be null")
        }

        if (id === null || id === undefined || (typeof id !== "string" && typeof id !== "number")) {
            throw new Error("Parameter \"id\" cant be null")
        }

        if (width === null || width === undefined || typeof width !== "number") {
            throw new Error("Parameter \"width\" cant be null")
        }

        if (height === null || height === undefined || typeof height !== "number") {
            throw new Error("Parameter \"height\" cant be null")
        }

        if (parent === null || parent === undefined || typeof parent !== "object") {
            throw new Error("Parameter \"parent\" cant be null")
        }

        this.instance = instance

        if (typeof id === "number") {
            id = id.toString()
        }

        this.canvas = document.createElement("canvas")
        this.canvas.id = id.toLowerCase().replace(/^a-zA-Z0-9/g, "-")
        this.canvas.width = width
        this.canvas.height = height
        parent.appendChild(this.canvas)

        this.properties = { x: 12, y: 12, zoom: 1 }

        var mouseDown = false

        this.canvas.addEventListener("mousedown", () => {
            mouseDown = true
        })

        window.addEventListener("mouseup", () => {
            mouseDown = false
        })

        this.canvas.addEventListener("mousemove", (event) => {
            if (mouseDown) {
                this.properties.x += event.movementX
                this.properties.y += event.movementY
            }
        })

        this.canvas.addEventListener("wheel", (event) => {
            this.properties.zoom += event.wheelDelta / 200

            if (this.properties.zoom < 0.25) {
                this.properties.zoom = 0.25
            }

            if (this.properties.zoom > 4) {
                this.properties.zoom = 4
            }
        })

        requestAnimationFrame(() => this.render())

        return this.canvas
    }

    render() {
        var ctx = this.canvas.getContext("2d")

        ctx.fillStyle = "#cccccc"
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        if (this.instance.parser.validate(this.instance.data, false, true)) {
            var prevPosition = [0, 0]

            var renderBlock = (block, indent = 0) => {
                if (typeof block.position === "object" && "length" in block.position) {
                    prevPosition = [...block.position]

                    ctx.fillStyle = "#ffffff"
                    ctx.fillStyle = "#d6b000"

                    ctx.beginPath()
                    ctx.moveTo(prevPosition[0] + this.properties.x, prevPosition[1] + this.properties.y + (10 * this.properties.zoom))
                    ctx.arcTo(prevPosition[0] + this.properties.x + (10 * this.properties.zoom), prevPosition[1] + this.properties.y, prevPosition[0] + this.properties.x + (40 * this.properties.zoom), prevPosition[1] + this.properties.y, 60)
                    ctx.lineTo(prevPosition[0] + this.properties.x + (120 * this.properties.zoom), prevPosition[1] + this.properties.y + (10 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (120 * this.properties.zoom), prevPosition[1] + this.properties.y + (60 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x, prevPosition[1] + this.properties.y + (60 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (50 * this.properties.zoom), prevPosition[1] + this.properties.y + (60 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (40 * this.properties.zoom), prevPosition[1] + this.properties.y + (70 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (20 * this.properties.zoom), prevPosition[1] + this.properties.y + (70 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (10 * this.properties.zoom), prevPosition[1] + this.properties.y + (60 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x, prevPosition[1] + this.properties.y + (60 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x, prevPosition[1] + this.properties.y + (60 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x, prevPosition[1] + this.properties.y + (10 * this.properties.zoom))
                    ctx.stroke()
                    ctx.fill()
                    ctx.closePath()

                    ctx.fillStyle = "#ffffff"
                    ctx.strokeStyle = "#ffffff"
                    ctx.textAlign = "left"
                    ctx.font = (15 * this.properties.zoom) + "px arial"

                    ctx.beginPath()
                    ctx.fillText("On start", prevPosition[0] + this.properties.x + (10 * this.properties.zoom), prevPosition[1] + this.properties.y + (40 * this.properties.zoom))
                    ctx.closePath()

                    prevPosition[1] += 60 * this.properties.zoom
                } else if (typeof block.position === "string" && block.position === "connected") {
                    prevPosition[1] += 50 * this.properties.zoom
                }

                ctx.fillStyle = "#666666"
                ctx.strokeStyle = "#888888"

                if (!this.instance.blockManager.get(block.id).properties.containsCode) {
                    ctx.beginPath()
                    ctx.moveTo(prevPosition[0] + this.properties.x + (7 * indent), prevPosition[1] + this.properties.y)
                    ctx.lineTo(prevPosition[0] + this.properties.x + (10 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y)
                    ctx.lineTo(prevPosition[0] + this.properties.x + (20 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (10 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (40 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (10 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (50 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y)
                    ctx.lineTo(prevPosition[0] + this.properties.x + (120 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y)
                    ctx.lineTo(prevPosition[0] + this.properties.x + (120 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (50 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (40 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (60 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (20 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (60 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (10 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (7 * indent), prevPosition[1] + this.properties.y)
                    ctx.stroke()
                    ctx.fill()
                    ctx.closePath()

                    ctx.fillStyle = "#ffffff"
                    ctx.strokeStyle = "#ffffff"
                    ctx.textAlign = "left"
                    ctx.font = (11 * this.properties.zoom) + "px arial"

                    ctx.beginPath()
                    ctx.fillText(this.instance.blockManager.get(block.id).name, prevPosition[0] + this.properties.x + (10 * this.properties.zoom), prevPosition[1] + this.properties.y + (32 * this.properties.zoom))
                    ctx.closePath()

                    if (!this.instance.blockManager.get(block.id).properties.noInput) {
                        // TODO Render inputs
                    }
                } else {
                    // TODO Properly render enclosing block

                    ctx.beginPath()
                    ctx.moveTo(prevPosition[0] + this.properties.x + (7 * indent), prevPosition[1] + this.properties.y)
                    ctx.lineTo(prevPosition[0] + this.properties.x + (10 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y)
                    ctx.lineTo(prevPosition[0] + this.properties.x + (20 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (10 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (40 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (10 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (50 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y)
                    ctx.lineTo(prevPosition[0] + this.properties.x + (120 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y)
                    ctx.lineTo(prevPosition[0] + this.properties.x + (120 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (50 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (40 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (60 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (20 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (60 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (10 * this.properties.zoom) + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (7 * indent), prevPosition[1] + this.properties.y + (50 * this.properties.zoom))
                    ctx.lineTo(prevPosition[0] + this.properties.x + (7 * indent), prevPosition[1] + this.properties.y)
                    ctx.stroke()
                    ctx.fill()
                    ctx.closePath()

                    ctx.fillStyle = "#ffffff"
                    ctx.strokeStyle = "#ffffff"
                    ctx.textAlign = "left"
                    ctx.font = (11 * this.properties.zoom) + "px arial"

                    ctx.beginPath()
                    ctx.fillText(this.instance.blockManager.get(block.id).name, prevPosition[0] + this.properties.x + (10 * this.properties.zoom), prevPosition[1] + this.properties.y + (32 * this.properties.zoom))
                    ctx.closePath()

                    if (!this.instance.blockManager.get(block.id).properties.noInput) {
                        // TODO Render inputs
                    }

                    for (var block of block.input[block.input.length - 1]) {
                        renderBlock(block, indent + 1)
                    }
                }
            }

            for (var block of this.instance.data.blocks) {
                renderBlock(block)
            }
        }

        requestAnimationFrame(() => this.render())
    }
}

export default Renderer
export { Renderer }