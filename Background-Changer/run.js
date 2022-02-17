var url = "https://apod.nasa.gov/apod.rss"

const del = require("del");
const Parser = require("rss-parser")
const parser = new Parser()
const scrape = require("website-scraper")
const fs = require("fs")
const wallpaper = require("wallpaper")
const path = require("path");
const nodeNotifier = require("node-notifier")
const open = require("open");

fs.stat("./pages", function (err, stats) {
    if (err) {
        run()
    } else {
        console.log("Deleting old files")

        async function remove() {
            await del(["./pages"])
        }
        remove()

        run()
    }
})

async function run() {
    console.log("Starting to read " + url)

    let feed = await parser.parseURL(url)

    console.log("Finished reading " + feed.title)

    var index = 0
    feed.items.forEach(item => {
        if (index == 1) {
            console.log("Downloading " + item.title + ": " + item.link)

            scrape({
                urls: [item.link],
                directory: "./pages",
                subdirectories: [
                    {
                        directory: "img",
                        extensions: [".jpg", ".png", ".svg"]
                    }
                ],
                sources: [
                    { selector: "img", attr: "SRC" }
                ]
            }, (err, result) => {
                if (err) throw err

                console.log("Finished Downloading")

                fs.readdir("./pages/img", function (err, files) {
                    if (err) throw err

                    files.forEach(function (file) {
                        console.log("Setting background to " + file)

                        wallpaper.set("./pages/img/" + file)

                        var start = item.content.indexOf('alt="') + 5
                        var end = item.content.indexOf('" border="0" />')

                        console.log("Deleting temp files")

                        fs.stat("./pages", function (err, stats) {
                            if (!err) {
                                async function remove() {
                                    await del(["./pages"])
                                }
                                remove()
                            }
                        })

                        console.log("Waitting for notification response")

                        nodeNotifier.notify({
                            appID: "Background Changer",
                            title: 'The background is "' + item.title + '"',
                            message: item.content.substring(start, end),
                            icon: __dirname + "/node_modules/notification.jpg",
                            sound: true,
                            wait: true
                        }, function (err, response, metadata) {
                            if (err) throw err

                            console.log("Notification " + response)

                            if (response == "dismissed" || response == "timeout") return

                            open(item.link)
                        });
                    })
                })
            })
        }

        index++
    })
}