module.exports = {
  displayName: "webamp-modern-test",
  testRegex: "\\.test\\.(js|ts)$",
  moduleFileExtensions: ["js", "tsx", "ts", "json"],
  moduleNameMapper: {
    '@lib/(.*)':  "<rootDir>/src/lib/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "build", "dist", "/temp/"],
};
