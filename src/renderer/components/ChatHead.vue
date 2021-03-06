<template>
	<div
		:style="chatHeadStyle"
		class="chat-head__wrapper"
		:class="{
			'is-unread': unread,
			'has-blur': !allVisible && index > 0,
			multiple: filteredImages.length > 1,
		}"
		@mousedown="handleMouseDown"
		@mouseup="handleMouseUp"
		@dblclick="hideChatHead"
	>
		<div
			class="chat-head__item"
			:class="{
				multiple: filteredImages.length > 1,
				'custom-size': customSize,
			}"
		>
			<div
				v-for="image in filteredImages"
				v-if="hasImage"
				:src="image"
				:style="`background-image: url('${image}');`"
			></div>
			<div
				v-if="filteredImages.length > 1"
				:style="`background-image: url('${filteredImages[0]}');`"
				class="blurryGroupBackground"
			></div>
		</div>
	</div>
</template>
<script>
export default {
	props: [
		'images',
		'name',
		'unread',
		'order',
		'index',
		'allVisible',
		'customSize',
		'hidden',
	],
	computed: {
		hasImage() {
			return !!this.images && this.images.length > 0;
		},
		filteredImages() {
			return this.images ? this.images.slice(0, 2) : [];
		},
		chatHeadStyle() {
			let { order, allVisible, index, transformStyle } = this;

			let styles = {
				'z-index': order,
				transform: transformStyle,
				opacity: !!allVisible || index < 2 ? '1' : '0',
			};

			return Object.keys(styles).reduce((acc, currKey) => {
				return (acc += `${currKey}: ${styles[currKey]};`);
			}, ``);
		},
		transformStyle() {
			const chatHeadWidth = 60;
			if (this.allVisible) {
				return `translateX(-${this.index * (chatHeadWidth + 4)}px)`;
			} else if (this.index < 2) {
				return `translateX(${this.index * 10}px) scale(${1 -
					0.1 * this.index});`;
			} else {
				return `translateX(0)`;
			}
		},
	},
	data: () => ({
		isDragging: false,
		delta: 50,
		startX: null,
		startY: null,
	}),
	methods: {
		handleMouseDown(event) {
			this.startX = event.pageX;
			this.startY = event.pageY;
		},
		handleMouseUp(event) {
			const { delta, startX, startY, isDragging, hidden } = this;
			const diffX = Math.abs(event.pageX - startX);
			const diffY = Math.abs(event.pageY - startY);

			if (
				diffX < delta &&
				diffY < delta &&
				!hidden
			) {
				this.$emit('select');
			}
		},
		hideChatHead() {
			this.$emit('hide');
		},
	},
};
</script>
<style lang="scss">
.chat-head {
	&__wrapper {
		-webkit-app-region: drag;
		pointer-events: all;
		user-select: none;
		transition: transform ease-out 0.3s, opacity ease-in 0.4s;
		box-shadow: 1px 0px 4px 0px black;
		border-radius: 100%;
		border: solid 1px white;
		background-color: white;
		width: 60px;
		height: 60px;

		&:hover {
			transform: scale(1.1);
		}

		&.has-blur::before {
			content: '';
			width: 100%;
			height: 100%;
			position: absolute;
			top: 0;
			left: 0;
			backdrop-filter: blur(2px) brightness(0.8);
			border-radius: 100%;
			z-index: 5;
		}

		&.is-unread {
			// animation: pulseHead .3s linear infinite;
			&::after {
				content: '';
				width: 12px;
				height: 12px;
				background-color: var(--red);
				display: block;
				border-radius: 100%;
				position: absolute;
				top: 4px;
				right: 4px;
				z-index: 6;
			}
		}
	}

	&__item {
		width: 100%;
		height: 100%;
		border-radius: 100%;
		transform: scale(1);
		transition: transform 0.3s;
		position: relative;
		overflow: hidden;

		> div {
			width: 100%;
			height: 100%;
			border-radius: 100%;
			border: solid 1px white;
			background-position: center center;
			background-size: cover;
		}

		&.custom-size {
			> div {
				background-size: 20px;
				background-repeat: no-repeat;
				background-color: whitesmoke;
			}
		}

		&.multiple {
			border: solid 1px white;

			> div {
				width: 40px;
				height: 40px;
				position: absolute;
			}

			> div:first-child {
				z-index: 5;
				top: 0;
				left: 0;
			}

			> div:nth-child(2) {
				z-index: 4;
				bottom: 0;
				right: 0;
			}
		}

		div.blurryGroupBackground {
			z-index: 0;
			width: 100%;
			height: 100%;
			filter: blur(10px);
		}
	}
}

@keyframes pulseHead {
	50% {
		transform: scale(1.03);
	}
}
</style>
