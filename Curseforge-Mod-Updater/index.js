/**
    @license
    MIT License
    Copyright (c) 2021 Kale Ko
    See https://kaleko.ga/license.txt
*/

const fs = require("fs")
const curseforge = require("mc-curseforge-api")

var modsdata = JSON.parse(fs.readFileSync("mods.json"))

modsdata.mods.sort((a, b) => (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0)))
modsdata.keep.sort((a, b) => (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0)))

fs.writeFileSync("mods.json", JSON.stringify(modsdata, null, 4))

if (!fs.existsSync(modsdata.modsdir)) fs.mkdirSync(modsdata.modsdir)

var files = fs.readdirSync(modsdata.modsdir)
files.forEach(file => { if (!modsdata.keep.includes(file)) fs.unlinkSync(modsdata.modsdir + "/" + file) })

if (!modsdata.async) {
    var downloaded = []

    var index = 0

    async function next() {
        if (index == modsdata.mods.length) return

        download(modsdata.mods[index]).then(() => {
            index++

            next()
        })
    }
    next()

    function download(mod) {
        return new Promise((resolve, reject) => {
            console.log("Started looking for " + mod.id)

            curseforge.getMods({ searchFilter: mod.id, sort: 1, pageSize: 20 }).then(mods => {
                if (downloaded.includes(mod.id)) { resolve(); return }

                var found = false

                mods.forEach(foundmod => {
                    if ((foundmod.key == mod.id || foundmod.name == mod.name)) {
                        found = true

                        console.log("Found " + mod.id)

                        console.log("Looking for a compatible version of " + mod.id)

                        foundmod.getFiles().then(files => {
                            var bestfile = null

                            files.forEach(file => {
                                if (((file.minecraft_versions.includes(modsdata.gameVersion) || mod.anyVersion || (modsdata.allowMajorVersions ? file.minecraft_versions.includes(modsdata.gameVersion.split(".").slice(0, 2).join(".")) : false)) && (file.minecraft_versions.includes(modsdata.gameType) || mod.anyType))) {
                                    if (bestfile == null) bestfile = file
                                    else {
                                        if (new Date(file.timestamp) > new Date(bestfile.timestamp)) bestfile = file
                                    }
                                }
                            })

                            if (bestfile != null) {
                                console.log("Found a compatible version of " + mod.id)

                                console.log("Downloading " + mod.id)

                                if (!downloaded.includes(mod.id)) {
                                    downloaded.push(foundmod.key)

                                    bestfile.download(modsdata.modsdir + "/" + foundmod.key + ".jar", true, false).then(() => {
                                        console.log("Finished downloading " + mod.id)

                                        downloadDependencies(bestfile)
                                    })
                                } else { console.log("Finished downloading " + mod.id); resolve() }

                                function downloadDependencies(file) {
                                    console.log("Downloading dependencies for " + mod.id)

                                    file.getDependencies().then(dependencies => {
                                        if (dependencies.length == 0) { console.log("No dependencies for " + mod.id); resolve() }

                                        var done = 0

                                        dependencies.forEach(dependency => {
                                            download({ id: dependency.key }).then(() => {
                                                done++

                                                if (done >= dependencies.length) resolve()
                                            })
                                        })
                                    })
                                }
                            } else { console.warn("Could not find compatible version of " + mod.id); resolve() }
                        })
                    }
                })

                if (!found) { console.warn("Could not find " + mod.id); resolve() }
            })
        })
    }
} else {
    var downloaded = []

    modsdata.mods.forEach(mod => {
        console.log("Started looking for " + mod.id)

        curseforge.getMods({ searchFilter: mod.id, sort: 1, pageSize: 20 }).then(mods => {
            if (downloaded.includes(mod.id)) return

            var found = false

            mods.forEach(foundmod => {
                if ((foundmod.key == mod.id || foundmod.name == mod.name)) {
                    found = true

                    console.log("Found " + mod.id)

                    console.log("Looking for a compatible version of " + mod.id)

                    foundmod.getFiles().then(files => {
                        var bestfile = null

                        files.forEach(file => {
                            if (((file.minecraft_versions.includes(modsdata.gameVersion) || mod.anyVersion || (modsdata.allowMajorVersions ? file.minecraft_versions.includes(modsdata.gameVersion.split(".").slice(0, 2).join(".")) : false)) && (file.minecraft_versions.includes(modsdata.gameType) || mod.anyType))) {
                                if (bestfile == null) bestfile = file
                                else {
                                    if (new Date(file.timestamp) > new Date(bestfile.timestamp)) bestfile = file
                                }
                            }
                        })


                        if (bestfile != null) {
                            console.log("Found a compatible version of " + mod.id)

                            console.log("Downloading " + mod.id)

                            if (!downloaded.includes(mod.id)) {
                                downloaded.push(foundmod.key)

                                bestfile.download(modsdata.modsdir + "/" + foundmod.key + ".jar", true, false).then(() => {
                                    console.log("Finished downloading " + mod.id)

                                    downloadDependencies(bestfile)
                                })
                            } else console.log("Finished downloading " + mod.id)

                            function downloadDependencies(file) {
                                console.log("Downloading dependencies for " + mod.id)

                                file.getDependencies().then(dependencies => {
                                    dependencies.forEach(dependency => {
                                        if (downloaded.includes(dependency.key)) return

                                        console.log("Looking for compatible version for " + dependency.key)

                                        dependency.getFiles().then(files => {
                                            var bestfile = null

                                            files.forEach(file => {
                                                if (((file.minecraft_versions.includes(modsdata.gameVersion) || mod.anyVersion) && (file.minecraft_versions.includes(modsdata.gameType) || mod.anyType))) {
                                                    if (bestfile == null) bestfile = file
                                                    else {
                                                        if (new Date(file.timestamp) > new Date(bestfile.timestamp)) bestfile = file
                                                    }
                                                }
                                            })

                                            if (bestfile != null && !downloaded.includes(dependency.key)) {
                                                console.log("Found compatible version for " + dependency.key)

                                                downloaded.push(dependency.key)

                                                bestfile.download(modsdata.modsdir + "/" + dependency.key + ".jar", true, false).then(() => {
                                                    console.log("Finished downloading " + dependency.key)

                                                    downloadDependencies(bestfile)
                                                })
                                            } else console.warn("Could not find compatible version of " + mod.id)
                                        })
                                    })
                                })
                            }
                        } else console.warn("Could not find compatible version of " + mod.id)
                    })
                }
            })

            if (!found) console.warn("Could not find " + mod.id)
        })
    })
}