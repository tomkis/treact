var path = require('path');

module.exports = {
  target: 'web',
  mode: 'development',
  devtool: 'sourcemap',
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
    rules: [{
      test: /\.jsx$|\.js$/,
      loaders: ['babel-loader'],
      include: path.resolve(__dirname, '../')
    }]
  }
};
