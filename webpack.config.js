const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
  plugins: [
    new HtmlWebpackPlugin({
      favicon: "./src/assets/brain.png",
      template: "./src/index.html"
    }),
  ],
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
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
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
