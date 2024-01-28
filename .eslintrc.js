module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["plugin:react/recommended", "airbnb", "prettier"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react"],
  rules: {
    "react/no-unknown-property": ["error", { ignore: ["css"] }],
    "react/jsx-filename-extension": "off",
    "react/react-in-jsx-scope": "off",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["webpack.config.mjs", "babel.config.mjs"],
      },
    ],
  },
};
