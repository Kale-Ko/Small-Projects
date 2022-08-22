const fs = require("fs")
const crypto = require("crypto")

import("node-fetch").then(fetch => {
    fetch = fetch.default

    function reliableFetch(url, options) {
        return new Promise((resolve, reject) => {
            var timeout = 30

            function download() {
                var controller = new AbortController()
                var timer = setTimeout(() => {
                    controller.abort()
                }, timeout * 1000)

                fetch(url, { ...options, signal: controller.signal }).then(res => {
                    clearInterval(timer)

                    resolve(res)
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

    function getJson(res) {
        return new Promise((resolve, reject) => {
            res.text().then(data => {
                try {
                    var json = JSON.parse(data)

                    if (json.error) {
                        console.error(json.error + ": " + json.description)

                        process.exit(1)
                    }

                    resolve(json)
                } catch (e) {
                    throw new Error("Received invalid json string '" + data + "' from '" + res.url + "'")
                }
            })
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

    var mode = process.argv[2]

    if (mode.toLowerCase() == "add") {
        for (var i = 3; i < process.argv.length; i++) {
            reliableFetch("https://api.modrinth.com/v2/project/" + process.argv[i].replace("https://modrinth.com/mod/", "")).then(res => getJson(res)).then(mod => {
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
        config.mods.forEach(mod => {
            if (mod.id.toLowerCase() == process.argv[3].replace("https://modrinth.com/mod/", "").toLowerCase() || (mod.slug != null && mod.slug.toLowerCase() == process.argv[3].replace("https://modrinth.com/mod/", "").toLowerCase())) {
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
    } else if (mode.toLowerCase() == "list") {
        config.mods.forEach(mod => {
            if (config.addExtraMeta) {
                console.log(mod.name + " (" + mod.slug + ")")
            } else {
                console.error("Can't list when addExtraMeta is false")
            }
        })
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
                console.log(messages[(messages.length) - i])
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
        }, 1000);

        var i = 0
        function next() {
            if (i == config.mods.length) {
                return
            }

            var id = config.mods[i]
            i++

            fetching++

            reliableFetch("https://api.modrinth.com/v2/project/" + (id.id || id), { out: (msg) => { messages.push(msg) } }).then(res => getJson(res)).then(mod => {
                if (config.addExtraMeta) {
                    config.mods[config.mods.indexOf(id)] = { id: mod.id, slug: mod.slug, name: mod.title, overrides: id.overrides }
                } else {
                    config.mods[config.mods.indexOf(id)] = mod.id
                }

                reliableFetch("https://api.modrinth.com/v2/project/" + (mod.id || mod) + "/version", { out: (msg) => { messages.push(msg) } }).then(res => getJson(res)).then(versions => {
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

                                if (!fs.existsSync(config.modsDir + "/" + (mod.slug) + ".jar")) {
                                    downloading++

                                    reliableFetch(file.url, { out: (msg) => { messages.push(msg) } }).then(res => res.buffer()).then(data => {
                                        modFiles.push(mod.slug + ".jar")
                                        fs.writeFileSync(config.modsDir + "/" + mod.slug + ".jar", data)

                                        downloaded++

                                        next()
                                    })
                                } else {
                                    if (file.hashes.sha512 != crypto.createHash("sha512").update(fs.readFileSync(config.modsDir + "/" + mod.slug + ".jar")).digest("hex")) {
                                        downloading++

                                        reliableFetch(file.url, { out: (msg) => { messages.push(msg) } }).then(res => res.buffer()).then(data => {
                                            modFiles.push(mod.slug + ".jar")
                                            fs.writeFileSync(config.modsDir + "/" + mod.slug + ".jar", data)

                                            downloaded++

                                            next()
                                        })
                                    } else {
                                        modFiles.push(mod.slug + ".jar")

                                        next()
                                    }
                                }
                            }
                        })
                    }

                    if (!foundVersion) {
                        messages.push("Could not find version for " + mod.title)

                        next()
                    }
                })
            })
        }

        for (var i2 = 0; i2 < config.maxConcurrentDownloads; i2++) {
            next()
        }

        function complete() {
            var mods = fs.readdirSync(config.modsDir)

            mods.forEach(mod => {
                if (!mod.startsWith("manual-") && !modFiles.includes(mod)) {
                    fs.unlinkSync(config.modsDir + "/" + mod)
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
            fs.writeFileSync("./cache.json", "[]")
        }

        var cache = JSON.parse(fs.readFileSync("./cache.json"))

        reliableFetch("https://api.modrinth.com/v2/search?index=updated&limit=100&offset=0&facets=" + JSON.stringify(facets)).then(res => getJson(res)).then(mods => {
            mods.hits.forEach(mod => {
                var found = false

                cache.search.forEach(cached => {
                    if (mod.project_id == cached.id) {
                        found = true

                        if (new Date(mod.date_modified).getTime() > cached.lastchange) {
                            cache.search[cache.search.indexOf(cached)].lastchange = new Date(mod.date_modified).getTime()

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

                    cache.search.push({ id: mod.project_id, lastchange: new Date(mod.date_modified).getTime() })
                }
            })

            fs.writeFileSync("./cache.json", JSON.stringify(cache, null, 2))
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
            fs.writeFileSync("./cache.json", "[]")
        }

        var cache = JSON.parse(fs.readFileSync("./cache.json"))

        function get(page) {
            reliableFetch("https://api.modrinth.com/v2/search?index=updated&limit=100&offset=" + (page * 100) + "&facets=" + JSON.stringify(facets)).then(res => getJson(res)).then(mods => {
                if (mods.hits.length > 0) {
                    mods.hits.forEach(mod => {
                        var found = false

                        cache.search.forEach(cached => {
                            if (mod.project_id == cached.id) {
                                found = true

                                if (new Date(mod.date_modified).getTime() > cached.lastchange) {
                                    cache.search[cache.search.indexOf(cached)].lastchange = new Date(mod.date_modified).getTime()
                                }
                            }
                        })

                        if (!found) {
                            cache.search.push({ id: mod.project_id, lastchange: new Date(mod.date_modified).getTime() })
                        }
                    })

                    fs.writeFileSync("./cache.json", JSON.stringify(cache, null, 2))

                    get(page + 1)
                }
            })
        }
        get(0)
    } else if (mode.toLowerCase() == "backup") {
        fs.writeFileSync("./update-backup.json", fs.readFileSync("./update.json"))
        fs.writeFileSync("./cache-backup.json", fs.readFileSync("./cache.json"))
    } else {
        return console.error("Unknown mode \"" + mode + "\"")
    }
})