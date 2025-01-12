import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable unused vars warning
      "@typescript-eslint/no-unused-vars": "warn",
      
      // Allow any type
      "@typescript-eslint/no-explicit-any": "off",
      
      // Allow regular img tags
      "@next/next/no-img-element": "off",
      
      // Other common rules to relax
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "react-hooks/exhaustive-deps": "warn"
    },
    ignorePatterns: [
      ".next/*",
      "node_modules/*",
      "public/*",
      "styles/*",
      "coverage/*",
      "dist/*",
      ".eslintrc.js"
    ]
  }
];

export default eslintConfig;
