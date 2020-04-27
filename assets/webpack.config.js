const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const config = {
  context: __dirname,
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  entry: {
    app: './index.jsx',
    'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
    'json.worker': 'monaco-editor/esm/vs/language/json/json.worker',
    'css.worker': 'monaco-editor/esm/vs/language/css/css.worker',
    'html.worker': 'monaco-editor/esm/vs/language/html/html.worker',
    'ts.worker': 'monaco-editor/esm/vs/language/typescript/ts.worker',
  },
  devServer: {
    stats: 'errors-only',
    progress: true
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    path: path.resolve('.package')
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,

        use: {
          loader: 'babel-loader',

          options: {
            cacheDirectory: path.join(
              __dirname,
              '.honeypack_cache/babel-loader'
            ),
            presets: ['env', 'react'],

            plugins: [
              'add-module-exports',
              'transform-decorators-legacy',
              'transform-class-properties',
              'transform-object-rest-spread'
            ]
          }
        }
      },
      {
        test: /\.(png|jpg|gif|svg)$/,

        use: {
          loader: 'file-loader',

          options: {
            name: '[name].[ext]',
            outputPath: 'images/'
          }
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,

        use: {
          loader: 'file-loader',

          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }
      },
      {
        test: /\.css$/,

        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader'
          }
        ]
      },
      {
        test: /\.less$/,

        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'less-loader',

            options: {
              javascriptEnabled: true
            }
          }
        ]
      },
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    // Ignore require() calls in vs/language/typescript/lib/typescriptServices.js
    new webpack.IgnorePlugin(
      /^((fs)|(path)|(os)|(crypto)|(source-map-support))$/,
      /vs(\/|\\)language(\/|\\)typescript(\/|\\)lib/
    )
  ],

  optimization: {
    minimizer: [
      new TerserWebpackPlugin({
        cache: path.join(__dirname, '.honeypack_cache/terser-webpack-plugin'),
        parallel: true
      })
    ],

    splitChunks: {
      cacheGroups: {
        commons: {
          test: module =>
            /[\\/]node_modules[\\/]/.test(module.resource) &&
            module.constructor.name !== 'CssModule',
          name: 'vendor',
          chunks: 'all'
        }
      }
    }
  }
};

module.exports = config;
