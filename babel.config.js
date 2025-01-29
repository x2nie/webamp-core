module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { 
      node: "current", 
      browsers: ["last 2 versions", "ie 11"] } }],
    "@babel/preset-typescript",
  ],
};
