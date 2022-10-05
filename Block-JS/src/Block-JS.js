window.BlockJS = null
window.blockJSReady = false

import Instance from "./Instance.js"

import Parser from "./Parser.js"
import Renderer from "./Renderer.js"
import BlockManager from "./BlockManager.js"

const BlockJS = {
    Instance,
    instances: [],
    Parser,
    Renderer,
    BlockManager
}

window.BlockJS = BlockJS
window.blockJSReady = true
window.dispatchEvent(new CustomEvent("blockJSReady"))

export default BlockJS
export { BlockJS, Instance, Parser, Renderer, BlockManager }