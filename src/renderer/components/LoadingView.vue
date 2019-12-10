<template>
	<div class="loader">
		<svg data-v-fb1278fc="" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg feather feather-loader"><line data-v-fb1278fc="" x1="12" y1="2" x2="12" y2="6"></line><line data-v-fb1278fc="" x1="12" y1="18" x2="12" y2="22"></line><line data-v-fb1278fc="" x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line data-v-fb1278fc="" x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line data-v-fb1278fc="" x1="2" y1="12" x2="6" y2="12"></line><line data-v-fb1278fc="" x1="18" y1="12" x2="22" y2="12"></line><line data-v-fb1278fc="" x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line data-v-fb1278fc="" x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
	</div>
</template>
<style lang="scss">
	.loader {
		pointer-events: none;
		display: flex;
		align-items: center;
		justify-content: center;
		border-top-right-radius: 4px;
		border-bottom-right-radius: 4px;
		width: 421px;
		height: 100vh;
		position: fixed;
		top:0;
		left: 0;
		z-index: 999999;
		backdrop-filter: blur(5px) brightness(.2);
		svg {
			stroke: white;
			transform: rotate(0deg);
			animation: spinUp linear 1s infinite;
		}
	}
	@keyframes spinUp {
		100% {
			transform: rotate(360deg);
		}
	}
</style>