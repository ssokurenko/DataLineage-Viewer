import * as webpack from "webpack";
import * as path from "path";
import * as fs from "fs";
import * as CopyWebpackPlugin from "copy-webpack-plugin";
declare var __dirname;

const config: webpack.Configuration = {
    entry: {
        "client-app": "./src/client/client-app.ts",
        "simulate-publisher": "./src/client/simulate/publisher.tsx",
        "simulate-processor": "./src/client/simulate/processor.tsx"
    },
    output: {
        path: path.resolve(__dirname, "./dist/public/javascripts/"),
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",//can use either 'awesome-typescript-loader' or "ts-loader", 'awesome-typescript-loader' will compiler ts file in memeory so no js file is generated (finnally, js will be bundle with webpack)
                exclude: /node_modules/,
                options: { onlyCompileBundledFiles: true }
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"]
    },
    plugins: [
        new CopyWebpackPlugin([
            // {output}/directory/with/extension.ext/file.txt
            {
                from: "./**",
                to: path.resolve(__dirname, "./dist/public/"),
                toType: "dir",
                context: path.resolve(__dirname, "./src/server/public/"),
                flatten: false
            },
            {
                from: "src/server/views/*",
                to: path.resolve(__dirname, "./dist/views/"),
                toType: "dir",
                flatten: true
            }
        ], {
            ignore: [

            ],
            // By default, we only copy modified files during
            // a watch or webpack-dev-server build. Setting this
            // to `true` copies all files.
            copyUnmodified: false
        })
    ],
    externals: {
        jquery: "jQuery",
        bootstrap: "bootstrap",
        d3: "d3"/*,
        toastr: "toastr"*/
    },
    devtool: "source-map"
};

const nodeModules: any = {};
fs.readdirSync("node_modules")
  .filter(function(x) {
    return [".bin"].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = "commonjs " + mod;
  });

const configServer:webpack.Configuration = {
    entry: {
        "server-app": "./src/server/server-app.ts"
    },
    target: "node",
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",//can use either 'awesome-typescript-loader' or "ts-loader", 'awesome-typescript-loader' will compiler ts file in memeory so no js file is generated (finnally, js will be bundle with webpack)
                exclude: /node_modules/,
                options: { onlyCompileBundledFiles: true }
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"]
    },
    context: __dirname,
    node: {
        __filename: false,
        __dirname: false
    },
    externals: nodeModules,
    devtool: "source-map"
};

export default [config, configServer];