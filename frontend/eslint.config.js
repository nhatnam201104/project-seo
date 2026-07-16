import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

/**
 * ESLint flat config (ESLint 9) cho React Router v7 + React 19 + TypeScript.
 * Không bật type-checked rules để lint chạy nhanh và không cần TS project service.
 */
export default tseslint.config(
  {
    ignores: ["build/", ".react-router/", "coverage/", "node_modules/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  jsxA11y.flatConfigs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // React 19 + jsx-runtime: không cần import React trong scope JSX.
      "react/react-in-jsx-scope": "off",
      // Dùng TypeScript types thay cho prop-types.
      "react/prop-types": "off",
      // Chỉ kiểm tra ARIA role trên DOM elements; bỏ qua props "role" của
      // component tự định nghĩa (vd RoleGate role="ADMIN" là API domain).
      "jsx-a11y/aria-role": ["error", { ignoreNonDOM: true }],
      // Cho phép bỏ qua biến/tham số không dùng nếu prefix bằng "_".
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
