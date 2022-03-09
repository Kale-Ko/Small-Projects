const fs = require("fs")
const { argv } = require("process")
const { pipeline } = require("stream")
const { promisify } = require("util")
const streamPipeline = promisify(pipeline);
import("node-fetch").then(async fetch => {
    fetch = fetch.default

    var config
    if (fs.existsSync("./update.json")) {
        try {
            config = JSON.parse(fs.readFileSync("./update.json"))
        } catch {
            return console.error("\"update.json\" is not a valid json file")
        }
    } else {
        return console.error("\"update.json\" file does not exist")
    }

    var mode = argv[2]

    if (mode.toLowerCase() == "update") {
        var mods = fs.readdirSync(config.modsDir)

        mods.forEach(mod => {
            if (!mod.startsWith("manual-")) {
                fs.unlinkSync(config.modsDir + "/" + mod)
            }
        })

        config.mods.forEach(async id => {
            fetch("https://api.modrinth.com/v2/project/" + (id.id || id)).then(res => res.json()).then(mod => {
                console.log("Found mod " + mod.title)

                config.mods[config.mods.indexOf(id)] = { id: mod.id, name: mod.title }

                fs.writeFileSync("./update.json", JSON.stringify(config, null, 2))

                console.log("Fetching version info for " + mod.title)

                fetch("https://api.modrinth.com/v2/project/" + (mod.id || mod) + "/version").then(res => res.json()).then(versions => {
                    var latest = null

                    versions.forEach(version => {
                        if (version.loaders.includes(config.loader) && version.game_versions.includes(config.version)) {
                            if (latest == null || new Date(version.date_published).getTime() > new Date(latest.date_published).getTime()) {
                                latest = version
                            }
                        }
                    })

                    var foundVersion = false

                    latest.files.forEach(file => {
                        if (file.primary || latest.files.length == 1) {
                            foundVersion = true

                            console.log("Downloading latest matching version for " + mod.title)

                            fetch(file.url).then(res => streamPipeline(res.body, fs.createWriteStream(config.modsDir + "/" + file.filename)).then(() => {
                                console.log("Finished downloading latest version for " + mod.title)
                            }))
                        }
                    })

                    if (!foundVersion) {
                        console.warn("Could not find version for " + mod.title)
                    }

                    if (config.resolveDependencies) {
                        latest.dependencies.forEach(dependency => {
                            if (dependency.version_id != null) {
                                fetch("https://api.modrinth.com/v2/version/" + dependency.version_id).then(res => res.json()).then(version => {
                                    version.files.forEach(file => {
                                        if (file.primary) {
                                            console.log("Downloading latest matching version for " + mod.title)

                                            fetch(file.url).then(res => streamPipeline(res.body, fs.createWriteStream(config.modsDir + "/" + file.filename)).then(() => {
                                                console.log("Finished downloading latest version for " + mod.title)
                                            }))
                                        }
                                    })
                                })
                            }
                        })
                    }
                })
            })
        })
    } else if (mode.toLowerCase() == "check") {
        var facets = [["categories:" + config.loader], ["versions:" + config.version], ["project_type:mod"]]

        if (config.type == "client") {
            facets.push(["client_side:optional", "client_side:required"])
            facets.push(["server_side:optional", "server_side:unsupported"])
        } else if (config.type == "server") {
            facets.push(["server_side:optional", "server_side:required"])
            facets.push(["client_side:optional", "client_side:unsupported"])
        } else if (config.type == "both") {
            facets.push(["client_side:optional", "client_side:required"])
            facets.push(["server_side:optional", "server_side:required"])
        }

        fetch("https://api.modrinth.com/v2/search?index=updated&limit=100&offset=0&facets=" + JSON.stringify(facets)).then(res => res.json()).then(mods => {
            if (!fs.existsSync("./cache.json")) {
                fs.writeFileSync("./cache.json", "[]")
            }
            var cache = JSON.parse(fs.readFileSync("./cache.json"))

            mods.hits.forEach(mod => {
                var found = false

                cache.forEach(cached => {
                    if (mod.project_id == cached.id) {
                        found = true

                        if (new Date(mod.date_modified).getTime() > cached.lastchange) {
                            cache[cache.indexOf(cached)].lastchange = new Date(mod.date_modified).getTime()

                            console.log("Found new update for " + mod.title + " https://modrinth.com/mod/" + mod.slug)
                        }
                    }
                })

                if (!found) {
                    console.log("New mod found " + mod.title + " https://modrinth.com/mod/" + mod.slug)

                    cache.push({ id: mod.project_id, lastchange: new Date(mod.date_modified).getTime() })
                }
            })

            fs.writeFileSync("./cache.json", JSON.stringify(cache, null, 2))
        })
    } else {
        return console.error("Unknown mode \"" + mode + "\"")
    }
})