import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import security from "eslint-plugin-security";


const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { security },
     rules: {
       ...security.configs.recommended.rules,
       "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
       "@typescript-eslint/no-explicit-any": "warn",
       "@typescript-eslint/no-non-null-assertion": "warn",
       "no-console": ["warn", { allow: ["warn", "error"] }],
     },
   },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    ".vercel/**",
  ]),
]);

export default eslintConfig;
