const fs = require("fs")
const crypto = require("crypto")

function reliableFetch(url, options) {
    return new Promise((resolve, reject) => {
        var timeout = 15

        function download() {
            var controller = new AbortController()
            var timer = setTimeout(() => {
                controller.abort()
            }, timeout * 1000)

            fetch(url, { ...options, signal: controller.signal }).then(res => {
                clearInterval(timer)

                if (options.dataType == "text") {
                    res.text().then(data => {
                        resolve(data)
                    })
                } else if (options.dataType == "json") {
                    res.text().then(data => {
                        try {
                            var json = JSON.parse(data)

                            if (json.error) {
                                if (json.error == "ratelimit_error") {
                                    var secs = json.description.split(".")[1].replace(/[^0-9]/g, "")

                                    if (options.out) {
                                        options.out("Retrying to fetch " + url + " in " + secs + " seconds")
                                    } else {
                                        console.warn("Retrying to fetch " + url + " in " + secs + " seconds")
                                    }

                                    setTimeout(() => {
                                        download()
                                    }, secs * 1000)
                                } else {
                                    console.error(json.error + ": " + json.description)

                                    process.exit(1)
                                }
                            } else {
                                resolve(json)
                            }
                        } catch (e) {
                            throw new Error("Received invalid json from '" + res.url + "'\n" + data)
                        }
                    })
                } else if (options.dataType == "buffer") {
                    res.arrayBuffer().then(data => {
                        resolve(Buffer.from(data))
                    })
                } else {
                    resolve(res)
                }
            }).catch(e => {
                if (e.type == "aborted") {
                    if (options.out) {
                        options.out("Retrying to fetch " + url + " with " + (timeout * 2) + " timeout")
                    } else {
                        console.warn("Retrying to fetch " + url + " with " + (timeout * 2) + " timeout")
                    }

                    timeout = timeout * 2

                    download()
                } else {
                    throw e
                }
            })
        }
        download()
    })
}

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

if (process.argv.length > 2) {
    var mode = process.argv[2]

    if (mode.toLowerCase() == "add") {
        for (var i = 3; i < process.argv.length; i++) {
            reliableFetch("https://api.modrinth.com/v2/project/" + process.argv[i].replace("https://modrinth.com/mod/", ""), { dataType: "json" }).then(mod => {
                if (config.addExtraMeta) {
                    config.mods.push({ id: mod.id, slug: mod.slug, name: mod.title })
                } else {
                    config.mods.push(mod.id)
                }

                console.log("Successfully added " + mod.title + " (" + mod.id + ")")

                if (config.sortMods && config.addExtraMeta) {
                    config.mods.sort((a, b) => {
                        if ((a.name || a) < (b.name || b)) {
                            return -1
                        } else if ((a.name || a) > (b.name || b)) {
                            return 1
                        } else {
                            return 0
                        }
                    })
                }

                fs.writeFileSync("./update.json", JSON.stringify(config, null, 2))
            })
        }
    } else if (mode.toLowerCase() == "remove") {
        for (var i = 3; i < process.argv.length; i++) {
            config.mods.forEach(mod => {
                if (mod.id.toLowerCase() == process.argv[i].replace("https://modrinth.com/mod/", "").toLowerCase() || (mod.slug != null && mod.slug.toLowerCase() == process.argv[i].replace("https://modrinth.com/mod/", "").toLowerCase())) {
                    config.mods.splice(config.mods.indexOf(mod), 1)

                    console.log("Successfully removed " + mod.name + " (" + mod.id + ")")

                    if (config.sortMods && config.addExtraMeta) {
                        config.mods.sort((a, b) => {
                            if ((a.name || a) < (b.name || b)) {
                                return -1
                            } else if ((a.name || a) > (b.name || b)) {
                                return 1
                            } else {
                                return 0
                            }
                        })
                    }

                    fs.writeFileSync("./update.json", JSON.stringify(config, null, 2))
                }
            })
        }
    } else if (mode.toLowerCase() == "list") {
        if (config.addExtraMeta) {
            if (process.argv.length > 3) {
                var printed = []

                config.mods.forEach(mod => {
                    if (mod.name.toLowerCase().startsWith(process.argv[3].toLowerCase()) || mod.slug.toLowerCase().startsWith(process.argv[3].toLowerCase())) {
                        printed.push(mod.slug)

                        console.log(mod.name + " (" + mod.slug + ")")
                    }
                })

                config.mods.forEach(mod => {
                    if ((mod.name.toLowerCase().includes(process.argv[3].toLowerCase()) || mod.slug.toLowerCase().includes(process.argv[3].toLowerCase())) && !printed.includes(mod.slug)) {
                        console.log(mod.name + " (" + mod.slug + ")")
                    }
                })
            } else {
                config.mods.forEach(mod => {
                    console.log(mod.name + " (" + mod.slug + ")")
                })
            }
        } else {
            console.error("Can't list when addExtraMeta is false")
        }
    } else if (mode.toLowerCase() == "update") {
        var mods = config.mods.length
        var fetching = 0
        var fetched = 0
        var downloading = 0
        var downloaded = 0

        var modFiles = []

        var messages = []

        var logger = setInterval(() => {
            console.clear()

            for (var i = 5; i > 0; i--) {
                if (messages[(messages.length) - i] != undefined) {
                    console.log(messages[(messages.length) - i])
                } else {
                    console.log("")
                }
            }

            console.log("Total: " + mods)
            console.log("Fetching: " + fetching)
            console.log("Fetched: " + fetched)
            console.log("Downloading: " + downloading)
            console.log("Downloaded: " + downloaded)

            if (fetched == mods && downloaded == downloading) {
                clearInterval(logger)

                complete()
            }
        }, 500);

        var i = 0
        function next() {
            if (i >= config.mods.length) {
                return
            }

            var id = config.mods[i]
            i++

            fetching++

            reliableFetch("https://api.modrinth.com/v2/project/" + (id.id || mod) + "/version", { dataType: "json", out: (msg) => { messages.push(msg) } }).then(versions => {
                fetched++

                var latest = null

                versions.forEach(version => {
                    if (version.loaders.includes(config.loader)) {
                        if (id.overrides != undefined && id.overrides.versions != undefined) {
                            id.overrides.versions.forEach(configVersion => {
                                if (version.game_versions.includes(configVersion)) {
                                    if (latest == null || new Date(version.date_published).getTime() > new Date(latest.date_published).getTime()) {
                                        latest = version
                                    }
                                }
                            })
                        } else {
                            config.versions.forEach(configVersion => {
                                if (version.game_versions.includes(configVersion)) {
                                    if (latest == null || new Date(version.date_published).getTime() > new Date(latest.date_published).getTime()) {
                                        latest = version
                                    }
                                }
                            })
                        }
                    }
                })

                if (latest == null) {
                    versions.forEach(version => {
                        if (version.loaders.includes(config.loader)) {
                            if (id.overrides != undefined && id.overrides.allowVersions != undefined) {
                                id.overrides.allowVersions.forEach(configVersion => {
                                    if (version.game_versions.includes(configVersion)) {
                                        if (latest == null || new Date(version.date_published).getTime() > new Date(latest.date_published).getTime()) {
                                            latest = version
                                        }
                                    }
                                })
                            } else {
                                config.allowVersions.forEach(configVersion => {
                                    if (version.game_versions.includes(configVersion)) {
                                        if (latest == null || new Date(version.date_published).getTime() > new Date(latest.date_published).getTime()) {
                                            latest = version
                                        }
                                    }
                                })
                            }
                        }
                    })
                }

                var foundVersion = false

                if (latest != null) {
                    latest.files.forEach(file => {
                        if (file.primary || latest.files.length == 1) {
                            foundVersion = true

                            if (!fs.existsSync(config.modsDir + "/" + (id.slug) + ".jar")) {
                                downloading++

                                reliableFetch(file.url, { dataType: "buffer", out: (msg) => { messages.push(msg) } }).then(data => {
                                    modFiles.push(id.slug + ".jar")

                                    fs.writeFileSync(config.modsDir + "/" + id.slug + ".jar", data)

                                    downloaded++

                                    next()
                                })
                            } else {
                                if (file.hashes.sha512 != crypto.createHash("sha512").update(fs.readFileSync(config.modsDir + "/" + id.slug + ".jar")).digest("hex")) {
                                    downloading++

                                    reliableFetch(file.url, { dataType: "buffer", out: (msg) => { messages.push(msg) } }).then(data => {
                                        modFiles.push(id.slug + ".jar")

                                        fs.writeFileSync(config.modsDir + "/" + id.slug + ".jar", data)

                                        downloaded++

                                        next()
                                    })
                                } else {
                                    modFiles.push(id.slug + ".jar")

                                    next()
                                }
                            }
                        }
                    })
                }

                if (!foundVersion) {
                    messages.push("Could not find version for " + id.name)

                    next()
                }
            })
        }

        for (var i2 = 0; i2 < config.maxConcurrentDownloads; i2++) {
            next()
        }

        function complete() {
            var mods = fs.readdirSync(config.modsDir)

            mods.forEach(mod => {
                if (!mod.startsWith("manual-") && !modFiles.includes(mod)) {
                    fs.rmSync(config.modsDir + "/" + mod)
                }
            })

            if (config.sortMods && config.addExtraMeta) {
                config.mods.sort((a, b) => {
                    if (a.name > b.name) {
                        return 1
                    } else if (a.name < b.name) {
                        return -1
                    } else {
                        return 0
                    }
                })
            }

            fs.writeFileSync("./update.json", JSON.stringify(config, null, 2))
        }
    } else if (mode.toLowerCase() == "check") {
        var type = process.argv[3]

        if (type != "new" && type != "updated" && type != "changed" && type != "all") {
            type = "all"
        }

        var facets = [["project_type:mod"], ["categories:" + config.loader]]

        config.versions.forEach(version => {
            facets.push(["versions:" + version])
        })

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

        if (!fs.existsSync("./cache.json")) {
            fs.writeFileSync("./cache.json", JSON.stringify({ search: [] }))
        }

        var cache = JSON.parse(fs.readFileSync("./cache.json"))

        reliableFetch("https://api.modrinth.com/v2/search?index=updated&limit=100&offset=0&facets=" + JSON.stringify(facets), { dataType: "json" }).then(mods => {
            mods.hits.forEach(mod => {
                var found = false

                cache.search.forEach(cached => {
                    if (mod.project_id == cached.id) {
                        found = true

                        if (new Date(mod.date_modified).getTime() > cached.lastChange) {
                            cache.search[cache.search.indexOf(cached)].lastChange = new Date(mod.date_modified).getTime()

                            if (type == "updated" || type == "changed" || type == "all") {
                                console.log("Found new update for " + mod.title + " https://modrinth.com/mod/" + mod.slug)
                            }
                        }
                    }
                })

                if (!found) {
                    if (type == "new" || type == "all") {
                        console.log("New mod found " + mod.title + " https://modrinth.com/mod/" + mod.slug)
                    }

                    cache.search.push({ id: mod.project_id, lastChange: new Date(mod.date_modified).getTime() })
                }
            })

            fs.writeFileSync("./cache.json", JSON.stringify(cache))
        })
    } else if (mode.toLowerCase() == "cacheall") {
        var facets = [["project_type:mod"], ["categories:" + config.loader]]

        config.versions.forEach(version => {
            facets.push(["versions:" + version])
        })

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

        if (!fs.existsSync("./cache.json")) {
            fs.writeFileSync("./cache.json", "{\"search\":[]}")
        }

        var cache = JSON.parse(fs.readFileSync("./cache.json"))

        function get(page) {
            reliableFetch("https://api.modrinth.com/v2/search?index=updated&limit=100&offset=" + (page * 100) + "&facets=" + JSON.stringify(facets), { dataType: "json" }).then(mods => {
                if (mods.hits.length > 0) {
                    mods.hits.forEach(mod => {
                        var found = false

                        cache.search.forEach(cached => {
                            if (mod.project_id == cached.id) {
                                found = true

                                if (new Date(mod.date_modified).getTime() > cached.lastChange) {
                                    cache.search[cache.search.indexOf(cached)].lastChange = new Date(mod.date_modified).getTime()
                                }
                            }
                        })

                        if (!found) {
                            cache.search.push({ id: mod.project_id, lastChange: new Date(mod.date_modified).getTime() })
                        }
                    })

                    fs.writeFileSync("./cache.json", JSON.stringify(cache))

                    get(page + 1)
                }
            })
        }
        get(0)
    } else {
        return console.error("Unknown option \"" + mode + "\"\nTry one of \"check\", \"update\", \"add\", \"remove\", \"list\", \"cacheAll\"")
    }
} else {
    return console.error("Must pass an option\nTry one of \"check\", \"update\", \"add\", \"remove\", \"list\", \"cacheAll\"")
}