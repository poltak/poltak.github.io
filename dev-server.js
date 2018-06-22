const express = require('express')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const config = require('./webpack.config.js')

// Set up dev-mode only config opts
config.mode = 'development'
config.plugins.push(new webpack.HotModuleReplacementPlugin())
config.entry.main = [config.entry.main, 'webpack-hot-middleware/client']

const compiler = webpack(config)

const runServer = (port, webpackCompiler) =>
    express()
        .use(
            webpackDevMiddleware(webpackCompiler, {
                publicPath: config.output.publicPath,
                stats: 'errors-only',
            }),
            webpackHotMiddleware(webpackCompiler),
        )
        .listen(port, () =>
            console.log(`\nwebpack server running: http://localhost:${port}\n`),
        )

runServer(3000, compiler)
