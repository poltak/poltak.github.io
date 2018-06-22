const path = require('path')
const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin')
const BuildNotifPlugin = require('webpack-build-notifier')
const HtmlPlugin = require('html-webpack-plugin')

const entry = {
    main: './src/index.tsx',
}

const output = {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
    publicPath: '/',
}

const devtool = 'cheap-module-eval-source-map'
const extensions = ['.ts', '.tsx', '.js', '.json']

const plugins = [
    new ForkTsCheckerPlugin({ tslint: true }),
    new HtmlPlugin({ title: 'poltak.github.io' }),
    new BuildNotifPlugin(),
]

const tsLoader = {
    test: /\.tsx?$/,
    loader: 'ts-loader',
    include: path.resolve(__dirname, './src'),
    options: {
        transpileOnly: true,
    },
}

const fileLoader = {
    test: /\.(png|jpg|gif)$/,
    loader: 'file-loader',
    options: {
        name: '[name].[ext]?[hash]',
    },
}

module.exports = {
    entry,
    output,
    module: {
        rules: [tsLoader, fileLoader],
    },
    plugins,
    resolve: { extensions },
    devtool,
}
