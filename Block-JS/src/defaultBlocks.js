const defaultBlocks = {
    setVar: {
        type: "function",
        name: "Set Var",
        validate: (input, instance) => {
            return input.length === 2 && typeof input[0] === "string" && input[1] !== null && input[1] !== undefined
        },
        parse: (input, instance) => {
            if (typeof arg === "string") {
                return "var " + input[0] + " = \"" + input[1].toString() + "\""
            } else if (typeof arg === "object") {
                return "var " + input[0] + " = " + JSON.stringify(input[1])
            } else if (typeof arg === "number" || typeof arg === "bigint" || typeof arg === "boolean" || typeof arg === "undefined" || arg === null) {
                return "var " + input[0] + " = " + input[1].toString()
            } else {
                return "var " + input[0] + " = \"" + input[1].toString() + "\""
            }
        },
        properties: {
            noInput: false,
            containsCode: false,
            doesIndent: true
        }
    },
    wait: {
        type: "function",
        name: "Wait",
        validate: (input, instance) => {
            return input.length === 2 && typeof input[0] === "number" && typeof input[1] === "object" && "length" in input[1]
        },
        parse: (input, instance) => {
            var subCode = instance.parser.parse({ version: 1, blocks: input[1] })

            return "setTimeout(() => {\n    " + subCode.substring(0, subCode.length - 1).replace(/\n/g, "\n    ") + "\n}, " + (input[0] * 1000) + ")"
        },
        properties: {
            noInput: false,
            containsCode: false,
            doesIndent: true
        }
    },
    repeat: {
        type: "function",
        name: "Repeat",
        validate: (input, instance) => {
            return input.length === 2 && typeof input[0] === "number" && typeof input[1] === "object" && "length" in input[1]
        },
        parse: (input, instance) => {
            var subCode = instance.parser.parse({ version: 1, blocks: input[1] })

            return "for (var i = 0; i < " + input[0] + "; i++) {\n    " + subCode.substring(0, subCode.length - 1).replace(/\n/g, "\n    ") + "\n}"
        },
        properties: {
            noInput: false,
            containsCode: true,
            doesIndent: false
        }
    },
    console_info: {
        type: "function",
        name: "Print Info",
        validate: (input, instance) => {
            return input.length > 0
        },
        parse: (input, instance) => {
            var args = []

            for (var arg of input) {
                if (typeof arg === "string") {
                    args.push("\"" + arg + "\"")
                } else if (typeof arg === "object") {
                    args.push(JSON.stringify(arg))
                } else if (typeof arg === "number" || typeof arg === "bigint" || typeof arg === "boolean" || typeof arg === "undefined" || arg === null) {
                    args.push(arg.toString())
                } else {
                    args.push("\"" + arg.toString() + "\"")
                }
            }

            return "console.info(" + args.join(", ") + ")"
        },
        properties: {
            noInput: false,
            containsCode: false,
            doesIndent: false
        }
    },
    console_warn: {
        type: "function",
        name: "Print Warning",
        validate: (input, instance) => {
            return input.length > 0
        },
        parse: (input, instance) => {
            var args = []

            for (var arg of input) {
                if (typeof arg === "string") {
                    args.push("\"" + arg + "\"")
                } else if (typeof arg === "object") {
                    args.push(JSON.stringify(arg))
                } else if (typeof arg === "number" || typeof arg === "bigint" || typeof arg === "boolean" || typeof arg === "undefined" || arg === null) {
                    args.push(arg.toString())
                } else {
                    args.push("\"" + arg + "\"")
                }
            }

            return "console.warn(" + args.join(", ") + ")"
        },
        properties: {
            noInput: false,
            containsCode: false,
            doesIndent: false
        }
    },
    console_error: {
        type: "function",
        name: "Print Error",
        validate: (input, instance) => {
            return input.length > 0
        },
        parse: (input, instance) => {
            var args = []

            for (var arg of input) {
                if (typeof arg === "string") {
                    args.push("\"" + arg + "\"")
                } else if (typeof arg === "object") {
                    args.push(JSON.stringify(arg))
                } else if (typeof arg === "number" || typeof arg === "bigint" || typeof arg === "boolean" || typeof arg === "undefined" || arg === null) {
                    args.push(arg.toString())
                } else {
                    args.push("\"" + arg + "\"")
                }
            }

            return "console.error(" + args.join(", ") + ")"
        },
        properties: {
            noInput: false,
            containsCode: false,
            doesIndent: false
        }
    }
}

export default defaultBlocks
export { defaultBlocks }