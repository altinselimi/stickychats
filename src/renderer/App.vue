<template>
	<div id="app">
		<router-view></router-view>
	</div>
</template>
<script>
import { remote } from 'electron';
const isProd = process.env.NODE_ENV !== 'development';

export default {
	created() {
		let win = remote.getCurrentWindow();
		window.addEventListener('mousemove', event => {
			if (event.target === document.documentElement) {
				isProd && win.setIgnoreMouseEvents(true, { forward: true }) // {forward: true} keeps generating MouseEvents
			} else {
				win.setIgnoreMouseEvents(false)
			}
		});

		let head = document.getElementsByTagName('head')[0];

		let analyticsScript = document.createElement('script');
		analyticsScript.type = 'text/javascript';
		analyticsScript.src = 'https://www.googletagmanager.com/gtag/js?id=UA-154349844-2';
		document.body.appendChild(analyticsScript);

		analyticsScript.onload = function() {
			let analyticsInit = document.createElement('script');
			analyticsInit.type = 'text/javascript';
			analyticsInit.text = `
				window.dataLayer = window.dataLayer || [];
		      	function gtag(){dataLayer.push(arguments);}
		      	gtag('js', new Date());
		      	gtag('config', 'UA-154349844-2');
			`;
			document.body.appendChild(analyticsInit);
		}
	},
	name: 'chatheads'
}
</script>
<style lang="scss">
html,
body,
#app {
	width: 100%;
	height: 100%;
	background: transparent;
}

body {
	margin: 0;
	pointer-events: none;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";

}

button {
	-webkit-app-region: no-drag;
}

:root {
	--theme: #008cff;
	--red: #FE4A49;
	--yellow: #ffe9a3;
    --light: #fbfbfb;
    --grey: #e1e0df;
    --dark-shade: #332f21;
}
</style>