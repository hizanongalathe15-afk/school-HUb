/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: [
		'./index.html',
		'./src/**/*.{js,ts,jsx,tsx}'
	],
	theme: {
		extend: {
			inset: {
				'y': '0',
			},
			animation: {
				'spin-slow': 'spin 1.5s linear infinite',
				'spin-fast': 'spin 0.5s linear infinite',
			},
		},
	},
	plugins: [],
};
