module.exports = {
    name: "",
    token: "",
    excludedRepos: [],
    excludedFiles: [],
    extensions: [
        {
            id: "html"
        },
        {
            id: "js",
            ignoreSpacesAfterEmptyBlockComments: true
        },
        {
            id: "ts",
            ignoreSpacesAfterEmptyBlockComments: true
        },
        {
            id: "css"
        },
        {
            id: "lua"
        },
        {
            id: "java",
            ignoreSpacesAfterEmptyBlockComments: true
        },
        {
            id: "cs"
        },
        {
            id: "cpp"
        },
        {
            id: "md",
            disableEndBlankLine: true
        },
        {
            id: "xml"
        },
        {
            id: "json",
            fileValidator: (contents) => {
                try {
                    return JSON.parse(contents) != undefined
                } catch (e) {
                    return false
                }
            }
        },
        {
            id: "yml",
            disableEndBlankLine: true
        },
        {
            id: "yaml",
            disableEndBlankLine: true
        }
    ]
}