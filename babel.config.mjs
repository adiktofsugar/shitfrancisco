export default {
  presets: [
    "@babel/preset-env",
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
        importSource: "@emotion/react",
        development: process.env.NODE_ENV !== "production",
      },
    ],
  ],
  plugins: ["@emotion"],
};
