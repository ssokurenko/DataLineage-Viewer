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
                from: "src/server/public/**/*",
                to: "dist/public/",
                toType: "dir",
                flatten: false
            },
            {
                from: "src/server/views/**/*",
                to: "dist/views/",
                toType: "dir",
                flatten: false
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
        bootstrap: "bootstrap"/*,
        toastr: "toastr"*/
    },
    devtool: "source-map"
};

export default config;