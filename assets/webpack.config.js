const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');
const ReplaceCSSUrl = require('webpack-plugin-replace-css-url');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const {ESBuildPlugin, ESBuildMinifyPlugin} = require('esbuild-loader');
const WebpackDynamicPublicPathPlugin = require('webpack-dynamic-public-path');
const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware');

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const appConfig = require('../config');


const isProduct = process.env.NODE_ENV === 'production';

// eslint-disable-next-line
console.log(`[webpack] build mode: ${isProduct ? 'production' : 'dev'}`);
const getOutput = () => {
  const base = {
    filename: '[name].js',
    chunkFilename: '[name].js',
    path: path.resolve('.package'),
    publicPath: appConfig.prefix + '/assets/',
  };

  if (isProduct) {
    return base;
  }

  // 开发模式下, 前端需要获取到文件的绝对路径
  return {
    ...base,
    pathinfo: true,
    devtoolModuleFilenameTemplate: info =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
  };
};

const config = {
  context: __dirname,
  mode: isProduct ? 'production' : 'development',
  devtool: isProduct ? 'none' : 'cheap-module-source-map',

  entry: {
    app: [
      !isProduct && require.resolve('react-dev-utils/webpackHotDevClient'),
      './src/index.js'
    ].filter(Boolean)
  },

  devServer: {
    stats: 'errors-only',
    progress: false,
    hotOnly: true,
    hot: true,
    contentBase: __dirname,
    injectHot: false,
    injectClient: false,
    transportMode: {
      server: 'ws'
    },
    publicPath: `${appConfig.prefix}/assets/`,
    before(app) {
      app.use(errorOverlayMiddleware());
    }
  },

  output: getOutput(),

  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@api': path.resolve(__dirname, './src/services'),
      '@coms': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@model': path.resolve(__dirname, './src/model'),
    }
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,

        use: {
          loader: 'babel-loader',

          options: {
            cacheDirectory: path.join(__dirname, '.honeypack_cache/babel-loader'),
            presets: [['env', {
              targets: {
                browsers: 'Chrome <= 70'
              }
            }], 'react'],

            plugins: [
              !isProduct && 'dva-hmr',
              'add-module-exports',
              'transform-class-properties',
              'transform-decorators-legacy',
              'transform-object-rest-spread',
              'syntax-dynamic-import'
            ].filter(Boolean)
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
      }
    ]
  },
  plugins: [
    new ProgressBarPlugin(
      {
        format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
        clear: true
      }
    ),
    new webpack.HotModuleReplacementPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    isProduct && new ReplaceCSSUrl({
      dirs: {
        css: ['stylesheet'],
      }
    }),
    new ESBuildPlugin({
      
    }),
    new WebpackDynamicPublicPathPlugin({
      externalPublicPath: 'window.CONFIG.prefix + "/assets/"'
    })
    // new BundleAnalyzerPlugin()
  ].filter(Boolean),

  optimization: {
    minimize: isProduct,
    minimizer: [
      new ESBuildMinifyPlugin()
    ]
  }
};

module.exports = config;
