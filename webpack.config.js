const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const generateCSSScopedName = require('./build/cssScoopeGenerator')();
const libAssets = require('./build/libAssets');

const WEB_APP = path.join(__dirname, 'web/app');
const MODULES = path.join(__dirname, 'modules');
const NODE_MODULES = path.join(__dirname, 'node_modules');
const INTEGRATION_TESTS = path.join(__dirname, 'web/test');

const GLOBAL_CSS = path.join(__dirname, 'web/css');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    index: ['babel-polyfill', './web/app/index'],
    sketcher: ['babel-polyfill', './web/app/sketcher']
  },
  output: {
    path: path.join(__dirname, 'dist/static'),
    // This directory is generated. Retire obsolete hashed workers/assets on rebuild.
    clean: true,
    filename: '[name].bundle.js',
    chunkFilename: '[id].bundle.js',
    // Infer the directory from the loaded bundle so nested deployments work.
    publicPath: 'auto'
  },
  externals: {
    'verb-nurbs': 'verb'
  },
  resolve: {
    alias: {
      // Node's timers API is not the unrelated npm "timers" cron package.
      'timers$': path.join(MODULES, 'platform/browserTimers.js'),
      // stream's browser mapping asks for the old emitter-component name.
      // Use the separately licensed, byte-identical 1.1.3 distribution.
      'emitter-component$': require.resolve('component-emitter'),
      'codi-physical-parameters-worker$': path.join(__dirname, '.build/physical-parameters-worker/worker.js'),
      'codi-headless-sketch-worker$': path.join(__dirname, '.build/headless-sketch-worker/worker.js'),
      'codi-prism-semantic-worker$': path.join(__dirname, '.build/prism-semantic-worker/worker.js'),
      'codi-manifold-worker$': path.join(__dirname, '.build/prism-assets/manifold-verified-worker.js'),
      'codi-manifold-worker-wasm$': path.join(__dirname, '.build/prism-assets/manifold-worker.wasm'),
      'codi-smlib-worker$': path.join(__dirname, '.build/raw-smlib-worker/raw-smlib-worker.js'),
      'codi-smlib-wasm$': path.join(__dirname, '.build/raw-smlib-worker/raw-provider.wasm'),
      'codi-enclosure-plan-module$': path.join(__dirname, '.build/prism-assets/enclosurePlan.mjs'),
      'codi-enclosure-contact-module$': path.join(__dirname, '.build/prism-assets/enclosureLabelContact.mjs'),
      'codi-enclosure-manufacturing-module$': path.join(__dirname, '.build/prism-assets/enclosureManufacturingMesh.mjs'),
      'codi-enclosure-mesh-module$': path.join(__dirname, '.build/prism-assets/enclosureMesh.mjs'),
      'codi-oci-verified-worker$': path.join(__dirname, '.build/prism-assets/oci-verified-worker.js'),
      'codi-occ-portable$': path.join(__dirname, '.build/prism-assets/occ-portable.js'),
      'codi-selected-profile-worker$': path.join(__dirname, '.build/selected-profile-assets/selected-profile-worker.js'),
      'codi-selected-profile-occ-portable$': path.join(__dirname, '.build/selected-profile-assets/selected-profile-occ-portable.js'),
      'codi-selected-profile-occ-wasm$': path.join(__dirname, '.build/selected-profile-assets/selected-profile-occ.wasm'),
      'codi-selected-profile-exact-volume$': path.join(__dirname, '.build/selected-profile-assets/exactMeshVolume.mjs'),
      'codi-exact-mesh-volume-module$': path.join(__dirname, '.build/prism-assets/exactMeshVolume.mjs'),
      'codi-selected-profile-plan$': path.join(__dirname, '.build/selected-profile-plan-entry.mjs'),
      'codi-polygon-profile-assets$': path.join(__dirname, '.build/polygon-profile-entry.mjs'),
      'codi-mechanical-profile-assets$': path.join(__dirname, '.build/mechanical-profile-entry.mjs'),
      'codi-boolean-history-assets$': path.join(__dirname, '.build/boolean-history-entry.mjs'),
      'codi-revolve-profile-assets$': path.join(__dirname, '.build/revolve-profile-entry.mjs'),
      'codi-sweep-profile-assets$': path.join(__dirname, '.build/sweep-profile-entry.mjs'),
      'codi-loft-profile-assets$': process.env.CODI_LOFT_NATIVE_DIR?.trim()?path.join(__dirname,'.build/loft-profile-entry.mjs'):path.join(__dirname,'modules/engine/mount/unavailable-loft-assets.mjs'),
      'codi-adaptive-metrology-assets$': process.env.CODI_ADAPTIVE_METROLOGY_NATIVE_DIR?.trim()?path.join(__dirname,'.build/adaptive-metrology-entry.mjs'):path.join(__dirname,'modules/engine/mount/unavailable-loft-assets.mjs'),
      'codi-manufacturing-mesh-assets$': path.join(__dirname,'.build/manufacturing-mesh-entry.mjs'),
      'codi-circular-assets$': path.join(__dirname,'.build/circular-entry.mjs'),
      'codi-mechanical-native-assets$': process.env.CODI_MECHANICAL_COHORT_NATIVE_DIR?.trim()?path.join(__dirname,'.build/mechanical-native-entry.mjs'):path.join(__dirname,'build/mechanical-native-candidate-entry.mjs'),
      'codi-analytic-profile-assets$': process.env.CODI_ANALYTIC_PROFILE_NATIVE_DIR?.trim()?path.join(__dirname,'.build/analytic-profile-entry.mjs'):path.join(__dirname,'build/analytic-profile-candidate-entry.mjs'),
      'codi-finite-curve-support-assets$': process.env.CODI_FINITE_CURVE_SUPPORT_NATIVE_DIR?.trim()?path.join(__dirname,'.build/finite-curve-support-entry.mjs'):path.join(__dirname,'build/finite-curve-support-candidate-entry.mjs'),
      'codi-shell-assets$': path.join(__dirname,'.build/shell-entry.mjs'),
      'codi-step-export-assets$': process.env.CODI_STEP_NATIVE_DIR?.trim()?path.join(__dirname,'.build/step-export-entry.mjs'):path.join(__dirname,'modules/engine/mount/unavailable-loft-assets.mjs'),
      'codi-prism-topology-module$': path.join(__dirname, '.build/prism-assets/profile-topology.mjs'),
      'codi-prism-profile-module$': path.join(__dirname, '.build/prism-assets/rectangleProfileRequest.mjs'),
      'codi-prism-regions-module$': path.join(__dirname, '.build/prism-regions-entry.mjs'),
      'codi-prism-plan-module$': path.join(__dirname, '.build/prism-assets/profilePlan.mjs'),
      'codi-hole-plan-module$': path.join(__dirname, '.build/prism-assets/centeredHolePlan.mjs'),
      'codi-prism-boundary-module$': path.join(__dirname, '.build/prism-assets/boundedPrismBoundary.mjs'),
      'codi-hole-topology-module$': path.join(__dirname, '.build/prism-assets/centeredHoleTopology.mjs'),
      'codi-four-corner-plan-module$': path.join(__dirname, '.build/prism-assets/fourCornerHolePlan.mjs'),
      'codi-four-corner-topology-module$': path.join(__dirname, '.build/prism-assets/fourCornerHoleTopology.mjs'),
      'codi-four-corner-provenance-module$': path.join(__dirname, '.build/prism-assets/fourCornerHoleProvenance.mjs'),
      'codi-occ-wasm$': path.join(__dirname, '.build/prism-assets/occ.wasm'),
      'codi-manufacturing-hash-worker$': path.join(__dirname, '.build/manufacturing-hash-worker/worker.js'),
      'codi-manufacturing-publication-worker$': path.join(__dirname, '.build/manufacturing-publication-worker/worker.js'),
      'codi-controlled-3mf-worker$': path.join(__dirname, '.build/controlled-3mf-worker/worker.js'),
      'codi-project-validation-worker$': path.join(__dirname, 'node_modules/.cache/codi-project-worker/worker.js'),
      'codi-native-archive-worker$': path.join(__dirname, '.build/native-archive-worker/worker.js'),
      ...(process.env.CODI_EMBED_NUMERIC === '1' ? {'numeric': path.join(__dirname, 'node_modules/.cache/codi-numeric/precompiled.js')} : {}),
      ...(process.env.CODI_EMBED_MANIFOLD === '1' ? {
        'manifold-3d$': path.join(__dirname, 'node_modules/.cache/codi-manifold/manifold.js'),
        'manifold-3d/manifold.wasm$': path.join(__dirname, 'node_modules/.cache/codi-manifold/manifold.wasm'),
      } : {}),
    },
    extensions: ['.js', '.jsx', ".ts", ".tsx"],
    modules: [MODULES, "node_modules", WEB_APP],
  },
  devServer: {
    hot: false,
    liveReload: false,
    client: false,
    static: [
      path.join(__dirname, 'web'),
    ],
    setupMiddlewares(middlewares, devServer) {
      libAssets.forEach(asset => {
        devServer.app.get(`/lib-assets/${asset}`, function (req, res) {
          res.sendFile(path.join(NODE_MODULES, asset))
        })
      });
      devServer.app.get('/manifold.wasm', function (req, res) {
        res.sendFile(path.join(NODE_MODULES, 'manifold-3d/manifold.wasm'))
      });
      return middlewares;
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        loader: 'babel-loader',
        include: [MODULES, WEB_APP, INTEGRATION_TESTS]
      },
      {include: [path.join(__dirname, '.build/prism-assets')], type: 'asset/resource', generator: {filename: '[name][ext]'}},
      {include: [path.join(__dirname, '.build/selected-profile-assets')], type: 'asset/resource', generator: {filename: '[name][ext]'}},
      {include: [path.join(__dirname, '.build/polygon-profile-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/polygon-profile-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected polygon asset path');
        return 'polygon-profile/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/mechanical-profile-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/mechanical-profile-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected mechanical asset path');
        return 'mechanical-profile/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/boolean-history-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/boolean-history-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected Boolean-history asset path');
        return 'boolean-history/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/revolve-profile-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/revolve-profile-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected revolve asset path');
        return 'revolve-profile/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/sweep-profile-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/sweep-profile-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected sweep asset path');
        return 'sweep-profile/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/loft-profile-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/loft-profile-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected loft asset path');
        return 'loft-profile/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/adaptive-metrology-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/adaptive-metrology-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected adaptive metrology asset path');
        return 'adaptive-metrology/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/manufacturing-mesh-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/manufacturing-mesh-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected manufacturing mesh asset path');
        return 'manufacturing-mesh/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/analytic-profile-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/analytic-profile-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Invalid analytic profile asset path');
        return 'analytic-profile/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/finite-curve-support-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/finite-curve-support-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected analytic query asset path');
        return 'finite-curve-support/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/mechanical-native-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/mechanical-native-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected mechanical Native asset path');
        return 'mechanical-native/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/circular-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/circular-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected circular asset path');
        return 'circular/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/shell-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/shell-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected shell asset path');
        return 'shell/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/step-export-assets')], type: 'asset/resource', generator: {filename: data => {
        const relative=path.relative(path.join(__dirname,'.build/step-export-assets'),path.resolve(__dirname,data.filename));
        if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unexpected adaptive metrology asset path');
        return 'step-export/'+relative.split(path.sep).join('/');
      }}},
      {include: [path.join(__dirname, '.build/raw-smlib-worker')], type: 'asset/resource', generator: {filename: '[name][ext]'}},
      {include: [path.join(__dirname, '.build/smlib-worker')], type: 'asset/resource', generator: {filename: '[name].[contenthash][ext]'}},
      {test: /worker\.js$/, include: [path.join(__dirname, '.build/prism-semantic-worker')], type: 'asset/resource', generator: {filename: 'prism-semantic.[contenthash][ext]'}},
      {test: /worker\.js$/, include: [path.join(__dirname, '.build/manufacturing-hash-worker')], type: 'asset/resource', generator: {filename: 'manufacturing-hash.[contenthash][ext]'}},
      {test: /worker\.js$/, include: [path.join(__dirname, '.build/manufacturing-publication-worker')], type: 'asset/resource', generator: {filename: 'manufacturing-publication.[contenthash][ext]'}},
      {test: /worker\.js$/, include: [path.join(__dirname, '.build/controlled-3mf-worker')], type: 'asset/resource', generator: {filename: 'controlled-3mf.[contenthash][ext]'}},
      {test: /worker\.js$/, include: [path.join(__dirname, '.build/native-archive-worker')], type: 'asset/resource', generator: {filename: 'native-archive.[contenthash][ext]'}},
      {test: /worker\.js$/, include: [path.join(__dirname, 'node_modules/.cache/codi-project-worker')], type: 'asset/resource', generator: {filename: 'project-validator.[contenthash][ext]'}},
      {test: /worker\.js$/, include: [path.join(__dirname, '.build/physical-parameters-worker')], type: 'asset/resource', generator: {filename: 'physical-parameters.[contenthash][ext]'}},
      {test: /worker\.js$/, include: [path.join(__dirname, '.build/headless-sketch-worker')], type: 'asset/resource', generator: {filename: 'sketch-solver.[contenthash][ext]'}},
      {
        test: /\.(less|css)$/,
        include: [GLOBAL_CSS, INTEGRATION_TESTS],
        use: [
          'style-loader',
          'css-loader?-url',
          'less-loader',
        ]
      },
      {
        test: /\.(css)$/,
        include: [NODE_MODULES],
        use: [
          'style-loader',
          'css-loader',
        ]
      },
      {
        oneOf: [
          {
            test: /\.(less|css)$/,
            include: [path.resolve(MODULES, 'ui/styles/global')],
            use: [
              'style-loader',
              'css-loader',
              'less-loader'
            ]
          },
          {
            test: /\.(less|css)$/,
            include: [MODULES, WEB_APP],
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  modules: {
                    mode: 'local',
                    getLocalIdent: (context, localIdentName, localName) => generateCSSScopedName(localName, context.resourcePath),
                  },
                  url: false
                }
              },
              'less-loader'
            ]
          }
        ],
      },
      {
        test: /\.wasm$/,
        exclude: [path.join(__dirname, '.build/analytic-profile-assets'),path.join(__dirname, '.build/polygon-profile-assets'),path.join(__dirname, '.build/mechanical-profile-assets'),path.join(__dirname, '.build/boolean-history-assets'),path.join(__dirname, '.build/revolve-profile-assets'),path.join(__dirname, '.build/sweep-profile-assets'),path.join(__dirname, '.build/loft-profile-assets'),path.join(__dirname, '.build/adaptive-metrology-assets'),path.join(__dirname, '.build/step-export-assets'),path.join(__dirname, '.build/manufacturing-mesh-assets'),path.join(__dirname, '.build/shell-assets'),path.join(__dirname, '.build/circular-assets'),path.join(__dirname, '.build/mechanical-native-assets'),path.join(__dirname, '.build/finite-curve-support-assets')],
        type: "javascript/auto",
        loader: "file-loader",
        options: {name: '[sha256:hash:hex:20].[ext]'}
      },
      {
        test: /\.svg$/,
        loader: 'raw-loader'
      },
      {
        test: /\.(png|jpg|gif)$/i,
        use: [
          {
            loader: 'url-loader'
          },
        ],
      },
    ]
  },
  plugins: [new webpack.DefinePlugin({__ACAD_SOURCE_OCCT__: JSON.stringify(process.env.CODI_SOURCE_OCCT === '1')}), new webpack.NormalModuleReplacementPlugin(/^node:module$/, path.join(__dirname, 'modules/brep/operations/mesh/browserNodeModuleStub.js'))],
  node: {
    __dirname: true
  }
};
