import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

export default [
	js.configs.recommended,
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		plugins: {
			"@typescript-eslint": typescript,
			react: react,
			"react-hooks": reactHooks,
			"simple-import-sort": simpleImportSort,
		},
		languageOptions: {
			parser: typescriptParser,
			globals: {
				...globals.browser,
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		settings: {
			react: {
				version: "19.1",
			},
		},
		rules: {
			...typescript.configs.recommended.rules,
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",
		},
	},
	{
		files: ["src/shared/*/*"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
];
