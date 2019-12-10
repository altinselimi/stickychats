<template>
	<h5 class="suggestion">
		{{message}}
	</h5>
</template>
<script>
	export default {
		props: ['message']
	}
</script>
<style lang="scss">
h5.suggestion {
	padding: 5px 8px;
	background-color: rgba(black, .7);
	backdrop-filter: blur(10px);
	border-radius: 4px;
	overflow: hidden;
	color: white;
	font-size: 12px;
	margin: 0px;
	flex-shrink: 0;
	text-align: center;
}
	
</style>