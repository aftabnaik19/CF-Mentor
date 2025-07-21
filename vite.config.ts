import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "path";

import manifest from "./src/manifest.json";

export default defineConfig({
	plugins: [react(), tsconfigPaths(), crx({ manifest })],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	// No need for manual rollupOptions - @crxjs/vite-plugin handles everything
	server: {
		port: 3000,
		hmr: {
			port: 3001,
		},
	},
});
