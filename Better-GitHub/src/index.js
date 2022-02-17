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
    var settings = null

    async function loadSetting() {
        var data = await chrome.storage.sync.get("better-github.options")

        settings = data["better-github.options"]
    }

    function getSetting(id) {
        var path = id.split(".")

        var object = settings
        path.forEach(segment => { object = object[segment] })

        return object
    }

    loadSetting().then(() => {
        var metadataList = document.querySelector("div.Layout-sidebar>div.BorderGrid>div.BorderGrid-row>div.BorderGrid-cell")
        var downloadList = document.querySelector("get-repo>feature-callout>details>div>div.dropdown-menu>div>ul.list-style-none")
        var fileActionList = document.querySelector("div.file-navigation>div.d-flex")

        if (metadataList != null) {
            var metadata = metadataList.children

            var lastIndex = -1

            var maxTry = 5

            function findExtraData() {
                for (var index = 0; index < metadata.length; index++) {
                    var data = metadata.item(index)

                    if (data.tagName == "INCLUDE-FRAGMENT" && data.classList.contains("is-error")) lastIndex = index
                }

                if (lastIndex == -1) {
                    if (maxTry != 0) {
                        maxTry--

                        setTimeout(findExtraData, 20)
                    } else console.error("Could not find error item in metadata list")
                } else setupExtraData()
            }
            findExtraData()

            function setupExtraData() {

                if (getSetting("extra-data.enable-size")) {
                    var sizeElementTag = document.createElement("h3")
                    sizeElementTag.setAttribute("class", "sr-only")
                    sizeElementTag.innerHTML = "Size"

                    var sizeElement = document.createElement("div")
                    sizeElement.setAttribute("class", "mt-3")
                    sizeElement.innerHTML = `<a class="Link--muted">
  <svg aria-hidden="true" height="16" viewBox="0 0 20 20" version="1.1" width="16" data-view-component="true" class="octicon octicon-law mr-2">
    <path d="M18.067 1.609c-0.497-0.326-1.193-0.615-2.069-0.858-1.742-0.484-4.050-0.75-6.498-0.75s-4.756 0.267-6.498 0.75c-0.877 0.243-1.573 0.532-2.069 0.858-0.619 0.407-0.933 0.874-0.933 1.391v12c0 0.517 0.314 0.985 0.933 1.391 0.497 0.326 1.193 0.615 2.069 0.858 1.742 0.484 4.050 0.75 6.498 0.75s4.756-0.267 6.498-0.751c0.877-0.243 1.573-0.532 2.069-0.858 0.619-0.406 0.933-0.874 0.933-1.391v-12c0-0.517-0.314-0.985-0.933-1.391zM3.27 1.714c1.658-0.46 3.87-0.714 6.23-0.714s4.573 0.254 6.23 0.714c1.795 0.499 2.27 1.059 2.27 1.286s-0.474 0.787-2.27 1.286c-1.658 0.46-3.87 0.714-6.23 0.714s-4.573-0.254-6.23-0.714c-1.795-0.499-2.27-1.059-2.27-1.286s0.474-0.787 2.27-1.286zM15.73 16.286c-1.658 0.46-3.87 0.714-6.23 0.714s-4.573-0.254-6.23-0.714c-1.795-0.499-2.27-1.059-2.27-1.286v-2.566c0.492 0.309 1.164 0.583 2.002 0.816 1.742 0.484 4.050 0.75 6.498 0.75s4.756-0.267 6.498-0.751c0.838-0.233 1.511-0.507 2.002-0.816v2.566c0 0.227-0.474 0.787-2.27 1.286zM15.73 12.286c-1.658 0.46-3.87 0.714-6.23 0.714s-4.573-0.254-6.23-0.714c-1.795-0.499-2.27-1.059-2.27-1.286v-2.566c0.492 0.309 1.164 0.583 2.002 0.816 1.742 0.484 4.050 0.75 6.498 0.75s4.756-0.267 6.498-0.75c0.838-0.233 1.511-0.507 2.002-0.816v2.566c0 0.227-0.474 0.787-2.27 1.286zM15.73 8.286c-1.658 0.46-3.87 0.714-6.23 0.714s-4.573-0.254-6.23-0.714c-1.795-0.499-2.27-1.059-2.27-1.286v-2.566c0.492 0.309 1.164 0.583 2.002 0.816 1.742 0.484 4.050 0.75 6.498 0.75s4.756-0.267 6.498-0.75c0.838-0.233 1.511-0.507 2.002-0.816v2.566c0 0.227-0.474 0.787-2.27 1.286z"/>
  </svg>
  <span class="repo-size">Loading..</span>
</a>`

                    metadataList.insertBefore(sizeElement, metadataList.children.item(lastIndex))
                    metadataList.insertBefore(sizeElementTag, metadataList.children.item(lastIndex))

                    var size = 0

                    function scan(path) {
                        fetch("https://api.github.com/repos/" + window.location.pathname.split("/")[1] + "/" + window.location.pathname.split("/")[2] + "/contents" + path + (window.location.pathname.split("/")[4] != undefined ? "?ref=" + window.location.pathname.split("/")[4] : ""), { headers: { Authorization: "token " + getSetting("auth.ghp") } }).then(res => res.json()).then(data => {
                            data.forEach(file => {
                                if (file.type == "dir") scan("/" + file.path)
                                else {
                                    size += file.size

                                    display()
                                }
                            })
                        })
                    }
                    scan("/")

                    function display() {
                        const units = ["Bytes", "KB", "MB", "GB", "TB"]

                        var finalsize = size
                        var unit = 0

                        while (finalsize > 1024) {
                            finalsize = finalsize / 1024

                            unit++
                        }

                        if (getSetting("extra-data.round-size")) document.querySelector("span.repo-size").innerHTML = Math.round(finalsize) + " " + units[unit]
                        else document.querySelector("span.repo-size").innerHTML = (Math.round(finalsize * 100) / 100) + " " + units[unit]
                    }
                }
            }

            if (getSetting("extra-data.enable-files")) {
                var sizeElementTag = document.createElement("h3")
                sizeElementTag.setAttribute("class", "sr-only")
                sizeElementTag.innerHTML = "Files"

                var sizeElement = document.createElement("div")
                sizeElement.setAttribute("class", "mt-3")
                sizeElement.innerHTML = `<a class="Link--muted">
  <svg aria-hidden="true" height="16" viewBox="0 0 318 318" version="1.1" width="16" data-view-component="true" class="octicon octicon-law mr-2">
    <path d="M270.825,70.55L212.17,3.66C210.13,1.334,207.187,0,204.093,0H55.941C49.076,0,43.51,5.566,43.51,12.431V304.57  c0,6.866,5.566,12.431,12.431,12.431h205.118c6.866,0,12.432-5.566,12.432-12.432V77.633  C273.491,75.027,272.544,72.51,270.825,70.55z M55.941,305.073V12.432H199.94v63.601c0,3.431,2.78,6.216,6.216,6.216h54.903  l0.006,222.824H55.941z"/>
  </svg>
  <span class="repo-files">Loading..</span>
</a>`

                metadataList.insertBefore(sizeElement, metadataList.children.item(lastIndex))
                metadataList.insertBefore(sizeElementTag, metadataList.children.item(lastIndex))

                var files = 0

                function scan(path) {
                    fetch("https://api.github.com/repos/" + window.location.pathname.split("/")[1] + "/" + window.location.pathname.split("/")[2] + "/contents" + path + (window.location.pathname.split("/")[4] != undefined ? "?ref=" + window.location.pathname.split("/")[4] : ""), { headers: { Authorization: "token " + getSetting("auth.ghp") } }).then(res => res.json()).then(data => {
                        data.forEach(file => {
                            if (file.type == "dir") scan("/" + file.path)
                            else {
                                files++

                                document.querySelector("span.repo-files").innerHTML = files + " files"
                            }
                        })
                    })
                }
                scan("/")
            }
        } else console.error("Could not find metadata list")

        if (downloadList != null) {
            var downloadOptions = downloadList.querySelectorAll("li>a.flex-items-center")

            var zipIndex = -1

            var maxTry = 5

            function findDownloadOpen() {
                for (var index = 0; index < downloadOptions.length; index++) {
                    var option = downloadOptions.item(index)

                    if (option.getAttribute("data-ga-click") != null && option.getAttribute("data-ga-click").includes("zip")) zipIndex = index
                    if (option.getAttribute("data-open-app") == "visual-studio") option.parentElement.remove()
                }

                if (lastIndex == -1) {
                    if (maxTry != 0) {
                        maxTry--

                        setTimeout(findDownloadOpen, 20)
                    } else console.error("Could not find zip option in download list")
                } else setupDownloadOpen()
            }
            findDownloadOpen()

            function setupDownloadOpen() {
                if (getSetting("download-open.enable-gitpod")) {
                    var gitpodElement = document.createElement("li")
                    gitpodElement.setAttribute("class", "Box-row Box-row--hover-gray p-3 mt-0")
                    gitpodElement.innerHTML = `<a class="d-flex flex-items-center color-fg-default text-bold no-underline" data-open-app="gitpod" data-action="click:get-repo#showDownloadMessage" href="https://gitpod.io/#https://github.com/${window.location.pathname.split("/")[1]}/${window.location.pathname.split("/")[2]}">
  <svg aria-hidden="true" height="16" viewBox="0 0 32 32" version="1.1" width="16" data-view-component="true" class="octicon octicon-file-zip mr-2">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M18.748 1.594a3.16 3.16 0 01-1.178 4.313l-9.437 5.387a.8.8 0 00-.403.695v8.456a.8.8 0 00.403.695l7.47 4.264a.8.8 0 00.794 0l7.47-4.264a.8.8 0 00.403-.695v-5.259l-6.715 3.785a3.167 3.167 0 01-4.312-1.2 3.16 3.16 0 011.202-4.308l9.607-5.415c2.927-1.65 6.548.463 6.548 3.82v9.22a6.016 6.016 0 01-3.035 5.224l-8.576 4.895a6.03 6.03 0 01-5.978 0l-8.576-4.895A6.016 6.016 0 011.4 21.087v-9.74a6.016 6.016 0 013.035-5.225L14.43.417a3.167 3.167 0 014.318 1.177z"/>
  </svg>
  Open with GitPod\
</a>`

                    downloadList.insertBefore(gitpodElement, downloadList.children.item(zipIndex))
                }

                if (getSetting("download-open.enable-visual-studio-code")) {
                    var VSCodeElement = document.createElement("li")
                    VSCodeElement.setAttribute("data-platforms", "windows,mac,linux")
                    VSCodeElement.setAttribute("class", "Box-row Box-row--hover-gray p-3 mt-0 js-remove-unless-platform")
                    VSCodeElement.innerHTML = `<a class="d-flex flex-items-center color-fg-default text-bold no-underline" data-open-app="vscode" data-action="click:get-repo#showDownloadMessage" href="vscode://vscode.git/clone?url=https://github.com/${window.location.pathname.split("/")[1]}/${window.location.pathname.split("/")[2]}">
  <svg aria-hidden="true" height="16" viewBox="0 0 42 40" version="1.1" width="16" data-view-component="true" class="octicon octicon-file-zip mr-2">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M30.2354 39.8836C29.9195 39.8862 29.6057 39.8287 29.3109 39.7139C28.9896 39.5885 28.6977 39.3979 28.4539 39.1539L12.6999 24.7799L9.23917 27.4037L5.83434 29.986C5.70454 30.0845 5.56201 30.1626 5.41164 30.2189C5.20259 30.2976 4.9783 30.3339 4.7519 30.3239C4.36361 30.3068 3.99356 30.1543 3.70588 29.8929L1.50588 27.8929C1.33452 27.7368 1.19763 27.5466 1.10396 27.3346C1.01029 27.1225 0.961914 26.8933 0.961914 26.6614C0.961914 26.4296 1.01029 26.2004 1.10396 25.9883C1.19763 25.7762 1.33452 25.5861 1.50588 25.4299L7.45788 19.9999L4.67072 17.4532L1.50734 14.5689C1.33584 14.4129 1.19883 14.2227 1.10507 14.0107C1.01132 13.7986 0.962891 13.5693 0.962891 13.3374C0.962891 13.1056 1.01132 12.8763 1.10507 12.6642C1.19883 12.4521 1.33584 12.262 1.50734 12.1059L3.70734 10.1059C3.72926 10.086 3.75165 10.0667 3.7745 10.048C4.05213 9.82027 4.39666 9.68789 4.7569 9.67196C5.14519 9.65479 5.52725 9.77401 5.83688 10.0089L12.6999 15.2179L28.4519 0.843942C28.5452 0.751682 28.6455 0.666763 28.7519 0.589942C29.1153 0.325601 29.5436 0.164633 29.9911 0.124137C30.0919 0.11502 30.1928 0.112086 30.2933 0.115234C30.6444 0.123748 30.9918 0.206443 31.3117 0.360027L39.5477 4.32103C39.9716 4.52522 40.3292 4.84487 40.5795 5.24325C40.7787 5.56023 40.9035 5.9168 40.9462 6.28629C40.9574 6.38148 40.9632 6.47754 40.9633 6.57401V6.67295C40.9633 6.65781 40.9631 6.64268 40.9627 6.62757V33.3704C40.9631 33.3552 40.9633 33.3401 40.9633 33.3249V33.4199C40.9633 33.5146 40.9579 33.609 40.9472 33.7025C40.9055 34.0754 40.7802 34.4355 40.5793 34.7552C40.329 35.1534 39.9714 35.4729 39.5477 35.677L31.3117 39.638C31.0191 39.7785 30.7037 39.8596 30.3833 39.879C30.3341 39.882 30.2848 39.8835 30.2354 39.8836ZM30.9509 10.9369L19.0028 19.9987L30.9549 29.0639L30.9509 10.9369Z"/>
  </svg>
  Open with VSCode\
</a>`
                    downloadList.insertBefore(VSCodeElement, downloadList.children.item(zipIndex))
                }
            }
        } else console.error("Could not find download list")

        if (fileActionList != null) {
            if (getSetting("misc.download-dirrectory")) {
                var downloadElement = document.createElement("a")
                downloadElement.setAttribute("class", "btn mr-2 d-none d-md-block")
                downloadElement.setAttribute("data-ga-click", "Repository, download folder, location:repo overview")
                downloadElement.setAttribute("data-pjax", "true")
                downloadElement.setAttribute("data-hotkey", "t")
                downloadElement.innerHTML = "Download folder"
                downloadElement.addEventListener("click", () => {
                    var zipreader = new zip.BlobWriter("application/zip")
                    var zipper = new zip.ZipWriter(zipreader, { bufferedWrite: true, useWebWorkers: false, lastModDate: new Date(), lastAccessDate: new Date(), creationDate: new Date() })

                    var toadd = 0

                    function scan(path) {
                        toadd++
                        fetch("https://api.github.com/repos/" + window.location.pathname.split("/")[1] + "/" + window.location.pathname.split("/")[2] + "/contents" + path + (window.location.pathname.split("/")[4] != undefined ? "?ref=" + window.location.pathname.split("/")[4] : ""), { headers: { Authorization: "token " + getSetting("auth.ghp") } }).then(res => res.json()).then(data => {
                            data.forEach(file => {
                                if (file.type == "dir") scan("/" + file.path)
                                else {
                                    toadd++

                                    zipper.add(file.name, new zip.HttpReader(file.download_url, { preventHeadRequest: true })).then((e) => {
                                        toadd--

                                        if (toadd == 0) download()
                                    })
                                }
                            })

                            toadd--
                        })
                    }
                    scan(window.location.pathname.split("/").splice(5, window.location.pathname.split("/").length - 5).join("/"))

                    function download() {
                        zipper.close().then(() => {
                            var data = zipreader.getData()

                            var download = document.createElement("a")
                            download.href = URL.createObjectURL(data)
                            download.download = window.location.pathname.split("/")[window.location.pathname.split("/").length - 1] + ".zip"
                            download.click()
                        })
                    }
                })

                fileActionList.prepend(downloadElement)
            }
        } else console.error("Could not find file action list")
    })
}