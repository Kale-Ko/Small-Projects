/**
    @license
    MIT License
    Copyright (c) 2021 Kale Ko
    See https://kaleko.ga/license.txt
*/

var optionsList = document.querySelector("div.options.list")

var options = {}

function getValue(input) {
    if (input.type == "checkbox") return input.checked
    else return input.value
}

function setValue(input, value) {
    if (input.type == "checkbox") input.checked = value
    else input.value = value
}

function setup() {
    function scan(item) {
        for (var index = 0; index < item.length; index++) {
            var element = item.item(index)

            if (element.tagName == "DIV") {
                options[element.id] = {}

                scan(element.children)
            } else if (element.tagName == "INPUT") {
                options[element.parentElement.id][element.id] = element.getAttribute("data-default")

                setValue(element, element.getAttribute("data-default"))

                element.addEventListener("change", event => {
                    options[event.srcElement.parentElement.id][event.srcElement.id] = getValue(event.srcElement)

                    save()
                })
            }
        }
    }
    scan(optionsList.children)

    load()
}
setup()

function load() {
    chrome.storage.sync.get("better-github.options").then(data => {
        if (data["better-github.options"] == undefined) return setup()

        data = data["better-github.options"]

        function scan(object) {
            Object.keys(object).forEach(key => {
                var element = document.querySelector("#" + key)

                if (element.tagName == "DIV") {
                    scan(object[key])
                } else if (element.tagName == "INPUT") {
                    options[element.parentElement.id][element.id] = object[key]

                    setValue(element, object[key])
                }
            })
        }
        scan(data)
    })
}

function save() {
    chrome.storage.sync.set({ "better-github.options": options })
}