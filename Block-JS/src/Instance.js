const Instance = class Instance {
    id

    data

    parser
    renderer
    blockManager

    constructor(id = Math.round(Math.random() * 2048)) {
        if (id === null || id === undefined || (typeof id !== "string" && typeof id !== "number")) {
            throw new Error("Parameter \"id\" cant be null")
        }

        if (typeof id === "number") {
            id = id.toString()
        }

        this.id = id.toLowerCase().replace(/^a-zA-Z0-9/g, "-")

        this.data = { version: 1, blocks: [] }

        this.parser = new BlockJS.Parser(this, false, false)
        this.blockManager = new BlockJS.BlockManager(this)

        BlockJS.instances.push(this)
    }

    createRenderer(width = 800, height = 600, parent = document.body) {
        this.renderer = new BlockJS.Renderer(this, this.id, width, height, parent)

        return this.renderer
    }

    parse(json, strict) {
        this.parser.parse(json, strict)
    }

    run(json, strict) {
        this.parser.run(json, strict)
    }

    render() {
        if (this.renderer != null) {
            this.renderer.render()
        }
    }

    getBlocks() {
        this.blockManager.getAll()
    }
}

export default Instance
export { Instance }