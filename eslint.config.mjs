import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      ".svelte-kit/**",
      "build/**",
      "dist/**",
      "convex/_generated/**",
      "coverage/**",
    ],
  },
  {
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
);
