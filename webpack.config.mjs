import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import { URL } from "url";
import path from "path";

const dirpath = path.dirname(new URL(import.meta.url).pathname);

const isProd = process.env.NODE_ENV === "production";

export default {
  mode: isProd ? "production" : "development",
  devtool: "source-map",
  output: {
    publicPath: "/",
  },
  devServer: {
    historyApiFallback: true,
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
    new CopyWebpackPlugin({
      patterns: ["src/media/favicon.ico"],
    }),
  ],
};
