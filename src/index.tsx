import { h, render } from 'preact'

let root: Element

function init() {
    const { Router } = require('./router')
    root = render(<Router />, document.body, root)
}

init()

if (module.hot) {
    module.hot.accept('./router', () => requestAnimationFrame(init))
}
