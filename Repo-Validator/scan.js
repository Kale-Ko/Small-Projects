const config = require("./config.json")
const fs = require("fs")
const fetch = require("fetch").fetchUrl
const extract = require("extract-zip");

var warnings = []

if (!fs.existsSync("./tmp")) {
    fs.mkdirSync("./tmp")

    console.log("Fetching repos..")

    fetch("https://api.github.com/user/repos", { headers: { "Authorization": "token " + config.token } }, (err, res, data) => {
        data = JSON.parse(data)

        console.log("Fetched " + data.length + " repos.")

        data.forEach(repo => {
            console.log("Downloading " + repo.full_name + "...")

            fetch("https://github.com/" + repo.full_name + "/archive/refs/heads/" + repo.default_branch + ".zip", { headers: { "Authorization": "token " + config.token } }, (err, res, data) => {
                if (!fs.existsSync("./tmp/" + repo.owner.login)) {
                    fs.mkdirSync("./tmp/" + repo.owner.login)
                }

                fs.writeFileSync("./tmp/" + repo.full_name + "-" + repo.default_branch + ".zip", data)

                console.log("Downloaded " + repo.full_name)

                console.log("Extracting " + repo.full_name + "...")

                extract("./tmp/" + repo.full_name + "-" + repo.default_branch + ".zip", { dir: __dirname.replace(/\\/g, "/") + "/tmp/" + repo.owner.login }).then(() => {
                    console.log("Extracted " + repo.full_name)
                })
            })
        })
    })
} else startScan()

function startScan() {
    var users = fs.readdirSync("./tmp")

    users.forEach(user => {
        var repos = fs.readdirSync("./tmp/" + user)

        repos.forEach(repo => {
            if (!config.excludedRepos.includes(repo) && fs.statSync("./tmp/" + user + "/" + repo).isDirectory()) {
                console.log("Scanning " + user + "/" + repo + "...")

                scan("./tmp/" + user + "/" + repo, user + "/" + repo, true)

                console.log("Scanned " + user + "/" + repo)
            }
        })
    })

    warnings.forEach(warning => {
        console.warn(warning)
    })
}

function scan(path, display, isRoot) {
    var files = fs.readdirSync(path)

    if (isRoot && !files.includes("LICENSE") && !files.includes("LICENCE")) {
        warnings.push(display + " has no license")
    }

    files.forEach(file => {
        if (config.excludedFiles.includes(file)) {
            return
        }

        var filestat = fs.statSync(path + "/" + file)

        if (filestat.isDirectory()) {
            scan(path + "/" + file, display + "/" + file, false)
        } else {
            config.extensions.forEach(extension => {
                if (file.split(".")[file.split(".").length - 1].toLowerCase() == extension.id.toLowerCase()) {
                    var contents = fs.readFileSync(path + "/" + file).toString()

                    if (!extension.disableEndBlankLine && (contents.endsWith("\r\n") || contents.endsWith("\n") || contents.endsWith("\r"))) warnings.push(display + "/" + file + " ends with a blank line")

                    var lines = contents.split("\n")
                    var index = 1
                    lines.forEach(line => {
                        if (!extension.disableBlankLine && line.includes(" ") && line.replace(/ /g, "").length == 0) warnings.push(display + "/" + file + " " + index + " is a blank line with spaces")
                        else if (!extension.disableSpaceEnd && line.endsWith(" ")) warnings.push(display + "/" + file + " " + index + " ends with a space")

                        index++
                    })
                }
            })
        }
    })
}