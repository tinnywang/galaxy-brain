const path = require('path');

module.exports = {
  entry: './src/index.ts',
  devServer: {
    compress: true,
    port: 8000,
    static: {
      directory: __dirname,
    }
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(glsl|vs|fs)$/,
        use: 'ts-shader-loader',
      },
      {
        test: /\.(jpg|jpeg|png)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
