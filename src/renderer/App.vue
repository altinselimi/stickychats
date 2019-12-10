<template>
	<div id="app">
		<router-view></router-view>
	</div>
</template>
<script>
import { remote } from 'electron';

export default {
	created() {
		let win = remote.getCurrentWindow();
		window.addEventListener('mousemove', event => {
			if (event.target === document.documentElement) {
				win.setIgnoreMouseEvents(true, { forward: true }) // {forward: true} keeps generating MouseEvents
			} else {
				win.setIgnoreMouseEvents(false)
			}
		});
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
	--main-bg-color: coral;
	--red: #FE4A49;
}
</style>