var path = require('path');
var webpack = require('webpack');

module.exports = {
  debug: true,
  target: 'web',
  devtool: 'sourcemap',
  plugins: [
    new webpack.NoErrorsPlugin()
  ],
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './example/main.js'
  ],
  output: {
    path: path.resolve(__dirname),
    filename: 'app.js'
  },
  module: {
    loaders: [{
      test: /\.jsx$|\.js$/,
      loaders: ['babel-loader'],
      include: path.resolve(__dirname, '../')
    }]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  }
};