module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module"
  },
  extends: ["airbnb-base", "prettier", "plugin:@typescript-eslint/recommended"],
  env: {
    es6: true,
    node: true,
    browser: true
  },
  globals: {
    DEBUG: true
  },
  plugins: ["@typescript-eslint", "json", "prettier"],
  rules: {
    "@typescript-eslint/ban-ts-ignore": "off",
    "no-plusplus": "off",
    "no-bitwise": "off",
    "prefer-rest-params": "off",
    "prettier/prettier": ["error"],
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-unused-expressions": ["error", { allowShortCircuit: true }],
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        ts: "never"
      }
    ],
    "max-len": [
      "warn",
      {
        code: 120,
        tabWidth: 2,
        comments: 1000,
        ignoreComments: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }
    ]
  },
  overrides: [
    {
      // enable the rule specifically for TypeScript files
      files: ["*.js", "*.jsx"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off"
      }
    }
  ],
  settings: {
    "import/resolver": {
      alias: {
        map: [["@/", "./src"]],
        extensions: [".ts", ".js", ".json"]
      }
    }
  }
};
