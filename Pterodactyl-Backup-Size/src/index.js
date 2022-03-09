window.addEventListener("load", () => {
    update()

    var prevHref = document.location.href

    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (prevHref != document.location.href) {
                prevHref = document.location.href

                update()
            }
        })
    })

    observer.observe(document.body, { childList: true, subtree: true })
})

function update() {
    if (window.location.pathname == "/" || window.location.pathname == "") {
        fetch("http://" + window.location.hostname + "/api/client?page=1" + (document.querySelector("input.sc-19rce1w-0.eDhiE").checked ? "&type=admin" : "")).then(res => res.json()).then(data => {
            console.log(document.querySelector("input.sc-19rce1w-0.eDhiE").checked, data)
            data.data.forEach(server => {
                fetch("http://" + window.location.hostname + "/api/client/servers/" + server.attributes.identifier + "/resources").then(res => res.json()).then(data => {
                    var serverStorage = data.attributes.resources.disk_bytes

                    fetch("http://" + window.location.hostname + "/api/client/servers/" + server.attributes.identifier + "/backups?page=1").then(res => res.json()).then(data => {
                        data.data.forEach(backup => {
                            serverStorage += backup.attributes.bytes
                        })

                        const units = ["Bytes", "KB", "MB", "GB", "TB"]

                        var roundedServerStorage = serverStorage
                        var unit = 0

                        while (roundedServerStorage > 1024) {
                            roundedServerStorage = roundedServerStorage / 1024

                            unit++
                        }

                        var roundedStorageString = (Math.round(roundedServerStorage * 100) / 100) + " " + units[unit]

                        var serverList = document.querySelector("div.x3r2dw-0.kbxq2g-0.evldyg.cZTZeB")

                        for (var index = 0; index < serverList.children.length; index++) {
                            var serverElement = serverList.children.item(index)

                            if (serverElement.href != null && serverElement.href.includes(server.attributes.identifier)) {
                                serverElement.querySelector("div.sc-1ibsw91-10.cFJOIm").querySelector("div.sc-1ibsw91-21.clbnEU").querySelector("div.sc-1ibsw91-22.hXevPX").querySelector("p.sc-1ibsw91-1.cUvpcr").innerHTML = roundedStorageString
                            }
                        }
                    })
                })
            })
        })
    } else if (window.location.pathname.startsWith("/server/")) {
        fetch("http://" + window.location.hostname + "/api/client/servers/" + window.location.pathname.split("/server/")[1] + "/resources").then(res => res.json()).then(data => {
            var serverStorage = data.attributes.resources.disk_bytes

            fetch("http://" + window.location.hostname + "/api/client/servers/" + window.location.pathname.split("/server/")[1] + "/backups?page=1").then(res => res.json()).then(data => {
                data.data.forEach(backup => {
                    serverStorage += backup.attributes.bytes
                })

                const units = ["Bytes", "KB", "MB", "GB", "TB"]

                var roundedServerStorage = serverStorage
                var unit = 0

                while (roundedServerStorage > 1024) {
                    roundedServerStorage = roundedServerStorage / 1024

                    unit++
                }

                var roundedStorageString = (Math.round(roundedServerStorage * 100) / 100) + " " + units[unit]

                document.querySelector("div.gvsoy-4.ifNwiE").querySelector("p.sc-168cvuh-13.cBEDGM").innerHTML = document.querySelector("div.gvsoy-4.ifNwiE").querySelector("p.sc-168cvuh-13.cBEDGM").innerHTML.replace(document.querySelector("div.gvsoy-4.ifNwiE").querySelector("p.sc-168cvuh-13.cBEDGM").innerText.split(" / ")[0].trim(), roundedStorageString)
            })
        })
    }
}