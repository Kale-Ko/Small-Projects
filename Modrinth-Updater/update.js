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
                                    var secs = parseInt(json.description.split(".")[1].replace(/[^0-9]/g, "")) + 1

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

var profile = config.profiles[config.currentProfile]

if (process.argv.length > 2) {
    var mode = process.argv[2]

    if (mode.toLowerCase() == "use") {
        if (config.profiles[process.argv[3]] != undefined) {
            config.currentProfile = process.argv[3]

            fs.writeFileSync("./update.json", JSON.stringify(config, null, 2))
        }
    } else if (mode.toLowerCase() == "add") {
        for (var i = 3; i < process.argv.length; i++) {
            reliableFetch("https://api.modrinth.com/v2/project/" + process.argv[i].replace("https://modrinth.com/mod/", ""), { dataType: "json" }).then(mod => {
                profile.mods.push({ id: mod.id, slug: mod.slug.trim(), name: mod.title.trim() })

                console.log("Successfully added " + mod.title.trim() + " (" + mod.id + ")")

                if (profile.sortMods) {
                    profile.mods.sort((a, b) => {
                        if (a.name < b.name) {
                            return -1
                        } else if (a.name > b.name) {
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
            profile.mods.forEach(mod => {
                if (mod.id.toLowerCase() == process.argv[i].replace("https://modrinth.com/mod/", "").toLowerCase() || mod.slug.toLowerCase() == process.argv[i].replace("https://modrinth.com/mod/", "").toLowerCase()) {
                    profile.mods.splice(profile.mods.indexOf(mod), 1)

                    console.log("Successfully removed " + mod.name + " (" + mod.id + ")")

                    if (profile.sortMods) {
                        profile.mods.sort((a, b) => {
                            if (a.name < b.name) {
                                return -1
                            } else if (a.name > b.name) {
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
        if (process.argv.length > 3) {
            var printed = []

            profile.mods.forEach(mod => {
                if (mod.name.toLowerCase().startsWith(process.argv[3].toLowerCase()) || mod.slug.toLowerCase().startsWith(process.argv[3].toLowerCase())) {
                    printed.push(mod.slug)

                    console.log(mod.name + " (" + mod.slug + ")")
                }
            })

            profile.mods.forEach(mod => {
                if ((mod.name.toLowerCase().includes(process.argv[3].toLowerCase()) || mod.slug.toLowerCase().includes(process.argv[3].toLowerCase())) && !printed.includes(mod.slug)) {
                    console.log(mod.name + " (" + mod.slug + ")")
                }
            })
        } else {
            profile.mods.forEach(mod => {
                console.log(mod.name + " (" + mod.slug + ")")
            })
        }
    } else if (mode.toLowerCase() == "fix") {
        var mods = []
        var found = []

        profile.mods.forEach(mod => {
            if (!found.includes(mod.id)) {
                mods.push({ id: mod.id, slug: mod.slug.trim(), name: mod.name.trim(), overrides: mod.overrides })
                found.push(mod.id)
            }
        })

        if (profile.sortMods) {
            mods.sort((a, b) => {
                if (a.name < b.name) {
                    return -1
                } else if (a.name > b.name) {
                    return 1
                } else {
                    return 0
                }
            })
        }

        profile.mods = mods

        fs.writeFileSync("./update.json", JSON.stringify(config, null, 2))
    } else if (mode.toLowerCase() == "update") {
        var mods = profile.mods.length
        var fetching = 0
        var fetched = 0
        var downloading = 0
        var downloaded = 0
        var messages = []

        var modFiles = []

        var logger = setInterval(() => {
            console.clear()

            for (var i = 12; i > 0; i--) {
                if (messages[(messages.length) - i] != undefined) {
                    console.log(messages[(messages.length) - i])
                } else {
                    console.log("")
                }
            }

            console.log("Fetching: " + fetching)
            console.log("Fetched: " + fetched)
            console.log("Downloading: " + downloading)
            console.log("Downloaded: " + downloaded)
            console.log(Math.round((((fetching / mods) / 5) + ((fetched / mods) / 2.5) + ((!isNaN(downloaded / downloading) ? (downloaded / downloading) : 1) / 2.5)) * 100) + "%")

            if (fetched == mods && downloaded == downloading) {
                clearInterval(logger)

                complete()
            }
        }, 500);

        var i = 0
        function next() {
            if (i >= profile.mods.length) {
                return
            }

            var id = profile.mods[i]
            i++

            fetching++

            reliableFetch("https://api.modrinth.com/v2/project/" + id.id + "/version", { dataType: "json", out: (msg) => { messages.push(msg) } }).then(versions => {
                fetched++

                var latest = null

                versions.forEach(version => {
                    if (version.loaders.includes(profile.loader)) {
                        if (id.overrides != undefined && id.overrides.versions != undefined) {
                            id.overrides.versions.forEach(configVersion => {
                                if (version.game_versions.includes(configVersion)) {
                                    if (latest == null || new Date(version.date_published).getTime() > new Date(latest.date_published).getTime()) {
                                        latest = version
                                    }
                                }
                            })
                        } else {
                            profile.versions.forEach(configVersion => {
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
                        if (version.loaders.includes(profile.loader)) {
                            if (id.overrides != undefined && id.overrides.allowVersions != undefined) {
                                id.overrides.allowVersions.forEach(configVersion => {
                                    if (version.game_versions.includes(configVersion)) {
                                        if (latest == null || new Date(version.date_published).getTime() > new Date(latest.date_published).getTime()) {
                                            latest = version
                                        }
                                    }
                                })
                            } else {
                                profile.allowVersions.forEach(configVersion => {
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

                            if (!fs.existsSync(profile.modsDir + "/" + (id.slug) + ".jar")) {
                                downloading++

                                reliableFetch(file.url, { dataType: "buffer", out: (msg) => { messages.push(msg) } }).then(data => {
                                    modFiles.push(id.slug + ".jar")

                                    fs.writeFileSync(profile.modsDir + "/" + id.slug + ".jar", data)

                                    downloaded++

                                    next()
                                })
                            } else {
                                if (file.hashes.sha512 != crypto.createHash("sha512").update(fs.readFileSync(profile.modsDir + "/" + id.slug + ".jar")).digest("hex")) {
                                    downloading++

                                    reliableFetch(file.url, { dataType: "buffer", out: (msg) => { messages.push(msg) } }).then(data => {
                                        modFiles.push(id.slug + ".jar")

                                        fs.writeFileSync(profile.modsDir + "/" + id.slug + ".jar", data)

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

        for (var i2 = 0; i2 < profile.maxConcurrentDownloads; i2++) {
            next()
        }

        function complete() {
            var mods = fs.readdirSync(profile.modsDir)

            mods.forEach(mod => {
                if (!mod.startsWith("manual-") && !modFiles.includes(mod)) {
                    fs.rmSync(profile.modsDir + "/" + mod)
                }
            })

            if (profile.sortMods) {
                profile.mods.sort((a, b) => {
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

        if (type != "new" && type != "updated" && type != "changed") {
            type = "all"
        }

        var facets = [["project_type:mod"], ["categories:" + profile.loader]]

        profile.versions.forEach(version => {
            facets.push(["versions:" + version])
        })

        if (profile.type == "client") {
            facets.push(["client_side:optional", "client_side:required"])
            facets.push(["server_side:optional", "server_side:unsupported"])
        } else if (profile.type == "server") {
            facets.push(["server_side:optional", "server_side:required"])
            facets.push(["client_side:optional", "client_side:unsupported"])
        } else if (profile.type == "both") {
            facets.push(["client_side:optional", "client_side:required"])
            facets.push(["server_side:optional", "server_side:required"])
        }

        if (!fs.existsSync("./cache.json")) {
            fs.writeFileSync("./cache.json", JSON.stringify({ search: [] }))
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

                    get(page + 1)
                }
            })
        }
        get(0)
    } else if (mode.toLowerCase() == "checksupport") {
        var tVersion = process.argv[3]

        var supported = 0
        var checked = 0
        var total = profile.mods.length

        if (tVersion != undefined) {
            var i = 0
            function next() {
                if (i >= profile.mods.length) {
                    return
                }

                var id = profile.mods[i]
                i++

                reliableFetch("https://api.modrinth.com/v2/project/" + id.id + "/version", { dataType: "json" }).then(versions => {
                    checked++

                    for (var version of versions) {
                        if (version.game_versions.includes(tVersion)) {
                            supported++

                            break
                        }
                    }

                    if (checked == total) {
                        complete()
                    } else {
                        next()
                    }
                })
            }

            for (var i2 = 0; i2 < profile.maxConcurrentDownloads; i2++) {
                next()
            }

            function complete() {
                console.log((Math.round((supported / total) * 10000) / 100) + "%")
                console.log(supported + " / " + total)
            }
        }
    } else {
        return console.error("Unknown option \"" + mode + "\"")
    }
} else {
    return console.error("Must pass an option")
}