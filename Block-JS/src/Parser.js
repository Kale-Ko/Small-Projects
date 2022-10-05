const Parser = class Parser {
    instance

    strict
    silent

    constructor(instance, strict = false, silent = false) {
        if (instance === null || instance === undefined || typeof instance !== "object") {
            throw new Error("Parameter \"instance\" cant be null")
        }

        if (strict === null || strict === undefined || typeof strict !== "boolean") {
            throw new Error("Parameter \"strict\" cant be null")
        }

        if (silent === null || silent === undefined || typeof silent !== "boolean") {
            throw new Error("Parameter \"silent\" cant be null")
        }

        this.instance = instance

        this.strict = strict
        this.silent = silent
    }

    validate(json, strict = this.strict, silent = this.silent) {
        if (json === null || json === undefined || typeof json !== "object") {
            throw new Error("Parameter \"json\" cant be null")
        }

        if (strict === null || strict === undefined || typeof strict !== "boolean") {
            throw new Error("Parameter \"strict\" cant be null")
        }

        if (silent === null || silent === undefined || typeof silent !== "boolean") {
            throw new Error("Parameter \"silent\" cant be null")
        }

        if (typeof json === "object" && "version" in json && json.version === 1 && "blocks" in json && typeof json.blocks === "object" && "length" in json.blocks) {
            for (var block of json.blocks) {
                if ("id" in block && typeof block.id === "string" && (!strict || ("input" in block && typeof block.input === "object" && "length" in block.input))) {
                    if (block.id in this.instance.blockManager.getOfType("function") && (this.instance.blockManager.get(block.id).properties.noInput || (this.instance.blockManager.get(block.id).properties.doesIndent ? this.instance.blockManager.get(block.id).validate([...block.input, []]) : this.instance.blockManager.get(block.id).validate(block.input)))) {
                        continue
                    } else {
                        if (!silent) {
                            throw new Error("Data Validation Error: Invalid block inputs for \"" + block.id + "\"\n" + JSON.stringify(block.input))
                        } else {
                            return new Error("Data Validation Error: Invalid block inputs for \"" + block.id + "\"\n" + JSON.stringify(block.input))
                        }
                    }
                } else {
                    if (!silent) {
                        throw new Error("Data Validation Error: Invalid block structure/type\n" + JSON.stringify(block))
                    } else {
                        return new Error("Data Validation Error: Invalid block structure/type\n" + JSON.stringify(block))
                    }
                }
            }
        } else {
            if (!silent) {
                throw new Error("Data Validation Error: Invalid data structure/type")
            } else {
                return new Error("Data Validation Error: Invalid data structure/type")
            }
        }

        return true
    }

    parse(json, strict = this.strict) {
        if (json === null || json === undefined || typeof json !== "object") {
            throw new Error("Parameter \"json\" cant be null")
        }

        if (strict === null || strict === undefined || typeof strict !== "boolean") {
            throw new Error("Parameter \"strict\" cant be null")
        }

        if (this.validate(json, strict, false)) {
            var script = ""

            for (var block of json.blocks) {
                if (this.instance.blockManager.get(block.id).properties.doesIndent) {
                    var input = block.input.slice()

                    input.push(json.blocks.slice(json.blocks.indexOf(block) + 1))

                    script += this.instance.blockManager.get(block.id).parse(input, this.instance) + "\n"

                    break
                } else {
                    script += this.instance.blockManager.get(block.id).parse(block.input, this.instance) + "\n"

                    if (json.blocks.indexOf(block) === json.blocks.length - 1 && !this.instance.blockManager.get(block.id).properties.containsCode) {
                        script += "// End\n"
                    }
                }
            }

            return script
        } else {
            throw new Error("Data Validation Error")
        }
    }

    run(json, strict = this.strict) {
        if (json === null || json === undefined || typeof json !== "object") {
            throw new Error("Parameter \"json\" cant be null")
        }

        if (strict === null || strict === undefined || typeof strict !== "boolean") {
            throw new Error("Parameter \"strict\" cant be null")
        }

        if (this.validate(json, strict, false)) {
            var code = this.parse(json)
            var response = null
            eval("response = new Promise((resolve, reject) => {\n    " + code.substring(0, code.length - 1).replace(/\n/g, "\n    ").replace(/\/\/ End/g, "resolve(true)") + "\n})")

            if (response !== null) {
                return response
            } else {
                return true
            }
        } else {
            throw new Error("Data Validation Error")
        }
    }
}

export default Parser
export { Parser }