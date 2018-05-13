import * as webpack from "webpack";
import * as path from "path";
import * as CopyWebpackPlugin from "copy-webpack-plugin";
declare var __dirname;

const config: webpack.Configuration = {
    entry: "./src/client/client-app.ts",
    output: {
        path: path.resolve(__dirname, "./dist/public/javascripts"),
        filename: "client-app.js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",//can use either 'awesome-typescript-loader' or "ts-loader", 'awesome-typescript-loader' will compiler ts file in memeory so no js file is generated (finnally, js will be bundle with webpack)
                exclude: /node_modules/,
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
                from: "src/server/public/*",
                to: path.resolve(__dirname, "./dist/public/"),
                toType: "dir",
                flatten: true
            },
            {
                from: "src/server/public/javascripts/*",
                to: path.resolve(__dirname, "./dist/public/javascripts"),
                toType: "dir",
                flatten: true
            },
            {
                from: "src/server/public/stylesheets/*",
                to: path.resolve(__dirname, "./dist/public/stylesheets"),
                toType: "dir",
                flatten: true
            },
            {
                from: "src/server/public/imgs/*",
                to: path.resolve(__dirname, "./dist/public/imgs"),
                toType: "dir",
                flatten: true
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

export default config;