const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware');
const ReplaceCSSUrl = require('webpack-plugin-replace-css-url');
const ESBuildPlugin = require('esbuild-minimizer-webpack-plugin').default;

const webpack = require('webpack');
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
  devtool: 'cheap-module-source-map',

  entry: {
    app: [
      !isProduct && require.resolve('react-dev-utils/webpackHotDevClient'),
      './src/index.js'
    ].filter(Boolean)
  },

  devServer: {
    stats: 'errors-only',
    progress: true,
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
      '@services': path.resolve(__dirname, './src/services'),
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
                browsers: 'Chrome >= 50'
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
        test: /\.(less|css)$/,

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
    new webpack.HotModuleReplacementPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    isProduct && new ReplaceCSSUrl({
      dirs: {
        css: ['stylesheet'],
      }
    }),
    // new BundleAnalyzerPlugin()
  ].filter(Boolean),

  optimization: {
    minimize: isProduct,
    minimizer: [
      new ESBuildPlugin()
    ],
  }
};

module.exports = config;
