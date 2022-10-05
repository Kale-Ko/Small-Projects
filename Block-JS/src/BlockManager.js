import defaultBlocks from "./defaultBlocks.js"

const BlockManager = class BlockManager {
    instance

    blocks = {}

    constructor(instance) {
        if (instance === null || instance === undefined || typeof instance !== "object") {
            throw new Error("Parameter \"instance\" cant be null")
        }

        this.instance = instance

        for (var block in defaultBlocks) {
            this.register(block, defaultBlocks[block])
        }
    }

    get(id) {
        if (id === null || id === undefined || typeof id !== "string") {
            throw new Error("Parameter \"id\" cant be null")
        }

        return this.blocks[id]
    }

    getAll() {
        var blocksCopy = {}

        for (var block in this.blocks) {
            blocksCopy[block] = this.blocks[block]
        }

        return blocksCopy
    }

    getOfType(type) {
        if (type === null || type === undefined || typeof type !== "string") {
            throw new Error("Parameter \"type\" cant be null")
        }

        var foundBlocks = {}

        for (var block in this.blocks) {
            if (this.blocks[block].type === type) {
                foundBlocks[block] = this.blocks[block]
            }
        }

        return foundBlocks
    }

    validate(block, silent = false) {
        if (typeof block === "object" && "type" in block && block.type === "function" && "name" in block && typeof block.name === "string" && ("validate" in block ? typeof block.validate === "function" : true) && ("parse" in block ? typeof block.parse === "function" : true)) {
            return true
        } else {
            if (!silent) {
                throw new Error("Block Validation Error: Invalid block structure/type")
            } else {
                return new Error("Block Validation Error: Invalid block structure/type")
            }
        }
    }

    register(id, block) {
        if (id === null || id === undefined || typeof id !== "string") {
            throw new Error("Parameter \"id\" cant be null")
        }

        if (block === null || block === undefined || typeof block !== "object") {
            throw new Error("Parameter \"block\" cant be null")
        }

        if (!(id in this.blocks)) {
            if (this.validate(block, false)) {
                this.blocks[id] = block

                return block
            } else {
                throw new Error("Block Validation Error")
            }
        } else {
            throw new Error("Block Register Error: Block \"" + id + "\" already exists")
        }
    }

    unregister(id) {
        if (id === null || id === undefined || typeof id !== "string") {
            throw new Error("Parameter \"id\" cant be null")
        }

        if (id in this.blocks) {
            delete this.blocks[id]

            return true
        } else {
            throw new Error("Block Unregister Error: Block \"" + id + "\" does not exists")
        }
    }
}

export default BlockManager
export { BlockManager }