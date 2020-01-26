<template>
	<h5 class="suggestion">
		{{ message }}
	</h5>
</template>
<script>
export default {
	props: ['message'],
};
</script>
<style lang="scss">
h5.suggestion {
	padding: 5px 8px;
	background-color: var(--yellow);
	backdrop-filter: blur(10px);
	border-radius: 4px;
	overflow: hidden;
	color: var(--dark-shade);
	font-size: 12px;
	font-weight: 500;
	margin: 0px;
	flex-shrink: 0;
	text-align: center;
	border-bottom-right-radius: 0px;
	border-bottom-left-radius: 0px;
	pointer-events:all;
	-webkit-app-region: drag;
}
</style>
