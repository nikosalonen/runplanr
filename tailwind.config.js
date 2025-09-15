/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	theme: {
		extend: {},
	},
	plugins: [
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require("daisyui"),
	],
	daisyui: {
		themes: ["light", "dark"],
	},
};
