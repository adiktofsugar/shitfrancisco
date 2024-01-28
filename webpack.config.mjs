import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import { URL, fileURLToPath } from "url";
import path from "path";

const dirpath = path.dirname(new URL(import.meta.url).pathname);

const isProd = process.env.NODE_ENV === "production";

/** @type {import('webpack').Configuration} */
export default {
  mode: isProd ? "production" : "development",
  devtool: "source-map",
  output: {
    publicPath: "/",
    filename: `[name]${isProd ? ".[chunkhash]" : ""}.js`,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(dirpath, "src"),
        loader: "babel-loader",
        options: {
          sourceMaps: true,
          rootMode: "upward",
        },
      },
      {
        test: /\.(png|jpg)$/,
        type: "asset/resource",
      },
      {
        test: /\.svg$/,
        type: "asset/source",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Shit Francisco Says",
    }),
    new HtmlWebpackPlugin({
      title: "Shit Francisco Says - Sign In Callback",
      filename: "sign-in.html",
    }),
    new HtmlWebpackPlugin({
      title: "Shit Francisco Says - Sign Out Callback",
      filename: "sign-out.html",
    }),
    new CopyWebpackPlugin({
      patterns: ["src/media/favicon.ico"],
    }),
  ],
};
