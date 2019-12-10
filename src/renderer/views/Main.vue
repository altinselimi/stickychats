<template>
	<div class="wrapper"
	     :class="{'logged-out': loggedIn === false && !isLoading}">
		<LoadingView v-show="isLoading"
		             :style="loggedIn === false ? 'width: 100vw;' : ''" />
		<Suggestion v-if="loggedIn === false && !isLoading"
		            message="It seems like you are not logged in. Please log in, and make sure you tick 'Keep me signed in' boxes."
		            style="pointer-events:all;-webkit-app-region: drag;" />
		<div v-if="recentHeads"
		     class="chatheads"
		     :class="{'heads-open': headsOpen}">
			<ChatHead v-for="(head, index) in recentHeads"
			          :all-visible.sync="headsOpen"
			          :key="head.name"
			          :images="head.images"
			          :unread="head.isUnseen"
			          :order="recentHeads.length - index"
			          :index="index"
			          @click.native="selectChat(head.id, index)"></ChatHead>
			<ChatHead :all-visible.sync="headsOpen"
			          :key="'new-message'"
			          :images="[newMessageImage]"
			          :unread="false"
			          :order="-1"
			          :index="recentHeads.length"
			          :custom-size="true"
			          @click.native="newMessage()"></ChatHead>
		</div>
		<div class="webview-wrapper"
		     v-show="!hideWebView">
			<div>
				<webview id="messengerWebView"
				         src="https://www.messenger.com/login/"
				         style="display:inline-flex;"
				         :class="{'needs-login' : !loggedIn}"></webview>
			</div>
		</div>
	</div>
</template>
<script>
import { remote } from 'electron';
var Mousetrap = require('mousetrap');
import faker from 'faker'
import ChatHead from '@/components/ChatHead.vue';
import LoadingView from '@/components/LoadingView';
import Suggestion from '@/components/Suggestion.vue';
const consoleSplitter = '+_+';
let base64AddIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIyMHB4IiBoZWlnaHQ9IjIwcHgiIHZpZXdCb3g9IjAgMCAyMCAyMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj4gICAgICAgIDx0aXRsZT5TVkcgTGF5ZXI8L3RpdGxlPiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4gICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+ICAgICAgICA8ZyBpZD0iU1ZHLUxheWVyIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNi41MDAwMDAsIC0zLjUwMDAwMCkiPiAgICAgICAgICAgIDxnIGlkPSJjb21wb3NlIj4gICAgICAgICAgICAgICAgPHBvbHlnb24gaWQ9IkZpbGwtMSIgcG9pbnRzPSIwIDMwIDMwIDMwIDMwIDAgMCAwIj48L3BvbHlnb24+ICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMi41MzkxNjY3LDE2Ljg4NTM3NSBMMTMuMzE3OTE2NywxNC41NDUzNzUgQzEzLjQwOTE2NjcsMTQuMjcwNzkxNyAxMy41NjMzMzMzLDE0LjAyMDc5MTcgMTMuNzY3OTE2NywxMy44MTYyMDgzIEwyMi45MDUsNC42NjgyOTE2NyBDMjMuNTc1LDMuOTk3NDU4MzMgMjQuNjYyNSwzLjk5NzQ1ODMzIDI1LjMzMjUsNC42NjgyOTE2NyBDMjYuMDAyMDgzMyw1LjMzODcwODMzIDI2LjAwMTY2NjcsNi40MjQxMjUgMjUuMzMyNSw3LjA5NDU0MTY3IEwxNi4xOTMzMzMzLDE2LjI0NDU0MTcgQzE1Ljk4ODMzMzMsMTYuNDQ5NTQxNyAxNS43MzgzMzMzLDE2LjYwNDEyNSAxNS40NjMzMzMzLDE2LjY5NTc5MTcgTDEzLjEyOTU4MzMsMTcuNDc0OTU4MyBDMTIuNzY1LDE3LjU5NzA0MTcgMTIuNDE3NSwxNy4yNDk5NTgzIDEyLjUzOTE2NjcsMTYuODg1Mzc1IFogTTIwLjAwNDE2NjcsMjMuMzM0MTI1IEwxMC4wMDA4MzMzLDIzLjMzNDEyNSBDOC4xNTkxNjY2NywyMy4zMzQxMjUgNi42NjY2NjY2NywyMS44NDEyMDgzIDYuNjY2NjY2NjcsMTkuOTk5OTU4MyBMNi42NjY2NjY2Nyw5Ljk5OTEyNSBDNi42NjY2NjY2Nyw4LjE1Nzg3NSA4LjE1OTE2NjY3LDYuNjY1Mzc1IDEwLjAwMDgzMzMsNi42NjUzNzUgTDE1LjgzNjI1LDYuNjY0NTQxNjcgQzE2LjI5NjI1LDYuNjY0NTQxNjcgMTYuNjY5NTgzMyw3LjAzNzg3NSAxNi42Njk1ODMzLDcuNDk3ODc1IEMxNi42Njk1ODMzLDcuOTU4MjkxNjcgMTYuMjk2MjUsOC4zMzE2MjUgMTUuODM2MjUsOC4zMzE2MjUgTDEwLjAwMDgzMzMsOC4zMzIwNDE2NyBDOS4wODA0MTY2Nyw4LjMzMjA0MTY3IDguMzMzNzUsOS4wNzgyOTE2NyA4LjMzMzc1LDkuOTk5MTI1IEw4LjMzMzc1LDE5Ljk5OTk1ODMgQzguMzMzNzUsMjAuOTIwMzc1IDkuMDgwNDE2NjcsMjEuNjY3MDQxNyAxMC4wMDA4MzMzLDIxLjY2NzA0MTcgTDIwLjAwNDE2NjcsMjEuNjY3MDQxNyBDMjAuOTI0NTgzMywyMS42NjcwNDE3IDIxLjY3MDgzMzMsMjAuOTIwMzc1IDIxLjY3MDgzMzMsMTkuOTk5OTU4MyBDMjEuNjcwODMzMywxOS45OTk5NTgzIDIxLjY3MDQxNjcsMTQuNjI2MjA4MyAyMS42NzA0MTY3LDE0LjE2NTc5MTcgQzIxLjY3MDQxNjcsMTMuNzA1Mzc1IDIyLjA0Mzc1LDEzLjMzMjA0MTcgMjIuNTA0MTY2NywxMy4zMzIwNDE3IEMyMi45NjQxNjY3LDEzLjMzMjA0MTcgMjMuMzM3NSwxMy43MDUzNzUgMjMuMzM3NSwxNC4xNjU3OTE3IEMyMy4zMzc1LDE0LjYyNjIwODMgMjMuMzM3OTE2NywxOS45OTk5NTgzIDIzLjMzNzkxNjcsMTkuOTk5OTU4MyBDMjMuMzM3OTE2NywyMS44NDEyMDgzIDIxLjg0NTQxNjcsMjMuMzM0MTI1IDIwLjAwNDE2NjcsMjMuMzM0MTI1IFoiIGlkPSJGaWxsLTIiIGZpbGw9IiMwMDAwMDAiIGZpbGwtcnVsZT0ibm9uemVybyI+PC9wYXRoPiAgICAgICAgICAgIDwvZz4gICAgICAgIDwvZz4gICAgPC9nPjwvc3ZnPg==';


export default {
	components: {
		ChatHead,
		LoadingView,
		Suggestion
	},
	computed: {
		recentHeads() {
			if (!this.heads) return null;

			return this.heads.slice(0, 4).sort(a => {
				return a.isActive === true ? -1 : 0;
			});
		},
	},
	created() {
		console.log('Created hook');
		Mousetrap.bind(['command+l', 'ctrl+l'], () => {
			this.clearSession();

			// return false to prevent default behavior and stop event from bubbling
			return false
		})
		this.handleWindowTransparentStates();
	},
	mounted() {
		const webview = document.querySelector('#messengerWebView');
		webview.addEventListener('dom-ready', () => {
			webview.addEventListener('console-message', (e) => {
				if (e.message.includes('userStatus')) {
					this.updateUserStatus(e.message);
				} else if (e.message.includes('updateChats')) {
					this.updateChats(e.message.split(consoleSplitter)[1]);
				}
			})
		})
		webview.addEventListener('did-start-loading', () => {
			this.webviewStatus = 'loading...';
			if (this.loggedIn) return;
			this.isLoading = true;
		})
		webview.addEventListener('did-stop-loading', () => {
			this.webviewStatus = 'done';
			this.isLoading = false;
			if (this.loggedIn) return;
			webview.executeJavaScript(`
				if(document.querySelector('[data-href="https://www.messenger.com/new"]')) {
					console.log('userStatus__loggedIn');
				}
				else {
					console.log('userStatus__loggedOut');
				}
			`);
		})
	},
	data: () => ({
		heads: null,
		loggedIn: null,
		isLoading: false,
		webviewStatus: null,
		headsOpen: false,
		blurListennerAttached: false,
		hideWebView: false,
		newMessageImage: base64AddIcon
	}),
	methods: {
		clearSession() {
			this.isLoading = true;
			let win = remote.getCurrentWindow();
			const ses = win.webContents.session
			ses.clearStorageData([], function(data) {
				console.log('cleared all');
				this.isLoading = false;
				const webview = document.querySelector('#messengerWebView');
				webview.executeJavaScript(`
					location.reload();
				`);
			})
		},
		handleWindowTransparentStates() {
			if (this.blurListennerAttached) return;
			console.log(Object.keys(remote));
			let win = remote.getCurrentWindow();
			win.on('blur', () => {
				if (!this.loggedIn) return;
				this.hideWebView = true;
				this.headsOpen = false;
			});
			win.on('focus', () => {
				if (!this.loggedIn) return;
				setTimeout(() => {
					this.hideWebView = false;
				}, 120);
			});
			this.blurListennerAttached = true;
		},
		newMessage() {
			const webview = document.querySelector('#messengerWebView');
			webview.executeJavaScript(`
				newMessage();
			`);
		},
		selectChat(id, index) {
			if (this.hideWebView) return;

			if (this.headsOpen === false) {
				this.headsOpen = true;
				return;
			}

			const webview = document.querySelector('#messengerWebView');
			webview.executeJavaScript(`
				selectChatHead('${id}');
			`);

			this.headsOpen = false;
		},
		updateUserStatus(message) {
			let newValue = false;
			if (message === 'userStatus__loggedIn') {
				newValue = true;
				// update only if these were different to begin with
				if (this.loggedIn !== newValue) this.updateLayout();
			} else if (message === 'userStatus__loggedOut') {
				newValue = false;
			}
			if (newValue !== this.loggedIn) {
				this.loggedIn = newValue;
			}

			this.checkWindowSize();
		},
		checkWindowSize() {
			let win = remote.getCurrentWindow();
			let [width, height] = win.getSize();
			console.log({width, height});

			if (this.loggedIn === false && height < 650) {
				win.setSize(width, 700);
			}

			if (this.loggedIn === true && width > 620) {
				win.setSize(620, height);
			}
		},
		updateChats(stringifiedChats) {
			this.heads = JSON.parse(stringifiedChats);
		},
		updateLayout() {
			const webview = document.querySelector('#messengerWebView');

			webview.executeJavaScript(`
	    		// Select the node that will be observed for mutations
				var targetNode = document.querySelector('ul[aria-label="Conversation List"]');

				// Options for the observer (which mutations to observe)
				var config = { attributes: true, childList: true, subtree: true };

				// Callback function to execute when mutations are observed
				var callback = function(mutationsList) {
				    console.log('Change has been observed');
				    scrapChatheads();
				};

				// Create an observer instance linked to the callback function
				var observer = new MutationObserver(callback);

				// Start observing the target node for configured mutations
				observer.observe(targetNode, config);


				function scrapChatheads() {
					let convosList = ('ul[aria-label="Conversation List"]');
					let convosListChildren = (convosList + ' > li');

					let chatsNode = document.querySelectorAll(convosListChildren);
					let chats = Array.from(chatsNode).reduce((acc, curr) => {
						let id = curr.querySelector('[data-testid]').getAttribute('data-testid');
						let isActive = curr.querySelector('[data-testid] a').getAttribute('tabindex') === '0';
						let imgNodes = curr.querySelectorAll(':scope > div:first-child img');
						let imgs = Array.from(imgNodes).map(imgNode => imgNode.getAttribute('src'));

						let nameMessageWrapper = curr.querySelector(':scope [data-tooltip-content] + div');
						let name = nameMessageWrapper.querySelector(':scope > div:first-child span');
						let lastMessage = nameMessageWrapper.querySelector(':scope > div:last-child span');
						let fontWeight = getComputedStyle(name).getPropertyValue('font-weight');
						acc.push({
							name: name.innerText,
							lastMessage: lastMessage.innerText,
							isUnseen: fontWeight === '700' || fontWeight === 'bold',
							isActive,
							id,
							images: imgs
						});
						return acc;
					}, []);

					console.log('updateChats' + '${consoleSplitter}' + JSON.stringify(chats));
				}

				function selectChatHead(id) {
					let targetForClick = document.querySelector('[data-testid="' + id + '"] a');
					if(targetForClick) targetForClick.click();
				}

				function newMessage() {
					let targetForClick = document.querySelector('[data-href="https://www.messenger.com/new"]');
					if(targetForClick) targetForClick.click();
				}

				scrapChatheads();
			`);
		},
	},
}
</script>
<style lang="scss">
.wrapper {
	background: transparent;
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;

	&.logged-out {
		-webkit-app-region: drag;

		.webview-wrapper {
			margin-right: 0px;
		}

		webview {
			margin-left: 0px;
			width: 100%;
			height: 100%;
		}
	}
}

.chatheads {
	display: flex;
	position: relative;
	height: 64px;
	justify-content: center;
	margin: auto;
	margin-top: 5px;
	transform: translateX(-32px);

	>div {
		flex-shrink: 0;
		position: absolute;
		top: 0;
		left: 0;
	}

	&.heads-opeen {
		>div {
			position: static;
		}
	}
}

iframe {
	border: none;
}

webview {
	background: white;
	width: calc(100% + 85px);
	height: 100%;
	margin-left: -85px;
}

.webview-wrapper {
	margin-top: 10px;
	flex: 1;
	display: flex;
	margin-right: 200px;
	position: relative;
	justify-content: center;
	padding: 1px;
	pointer-events: all;

	&:before {
		content: '';
		border: solid lighten(#D9D9D9, 10);
		border-width: 0px 15px 15px 0px;
		display: inline-block;
		position: absolute;
		z-index: -1;
		transform: rotate(225deg) translate(-5px, -5px);
		top: 0px;
	}

	>div {
		box-shadow: 0px 0px 1px 1px #D9D9D9;
		display: flex;
		justify-content: center;
		position: relative;
		flex: 1;
		pointer-events: all;
		margin: 5px;
		background-color: transparent;
		border-radius: 8px;
		overflow: hidden;
	}
}
</style>