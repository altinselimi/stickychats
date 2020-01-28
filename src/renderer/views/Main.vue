<template>
	<div
		class="wrapper"
		:class="{ 'logged-out': loggedIn === false && !isLoading }"
	>
		<LoadingView
			v-show="isLoading"
			:style="loggedIn === false ? 'width: 100vw;' : ''"
		/>
		<Suggestion
			v-if="loggedIn === false && !isLoading"
			:message="loggedOutMessage"
		/>
		<Suggestion
			id="update-suggestion"
			v-if="updateAvailable && loggedIn"
			@click.native="updateApp()"
			:message="updateAvailableMessage"
		/>
		<div class="app-version" v-if="showAppVersion">
			<span>v{{appVersion}}</span>
		</div>
		<div
			v-if="recentHeads"
			class="chatheads"
			:class="{ 'heads-open': headsOpen }"
		>
			<ChatHead
				v-for="(head, index) in recentHeads"
				:all-visible.sync="headsOpen"
				:key="head.name"
				:images="head.images"
				:unread="head.isUnseen"
				:hidden="head.isHidden"
				:order="recentHeads.length - index"
				:index="index"
				@select="selectChat(head.id, index)"
				@hide="hideChat(head.id, index)"
			></ChatHead>
			<ChatHead
				:all-visible.sync="headsOpen"
				:key="'new-message'"
				:images="[newMessageImage]"
				:unread="false"
				:order="-1"
				:index="recentHeads.length"
				:custom-size="true"
				@click.native="newMessage()"
			></ChatHead>
		</div>
		<div class="webview-wrapper" v-show="!hideWebView">
			<div>
				<webview
					id="messengerWebView"
					src="https://www.messenger.com/login/"
					style="display:inline-flex;"
					:class="{ 'needs-login': !loggedIn }"
				></webview>
			</div>
		</div>
	</div>
</template>
<script>
import { remote, ipcRenderer } from "electron";
import { createNamespacedHelpers } from 'vuex';
var Mousetrap = require("mousetrap");
import faker from "faker";
import ChatHead from "@/components/ChatHead.vue";
import LoadingView from "@/components/LoadingView";
import Suggestion from "@/components/Suggestion.vue";
const consoleSplitter = "+_+";
const base64AddIcon = require('../assets/new-message-base64.js').default;

const { mapState, mapActions, mapGetters, mapMutations } = createNamespacedHelpers('UiState');

export default {
	components: {
		ChatHead,
		LoadingView,
		Suggestion
	},
	computed: {
		...mapGetters(['getWebviewID']),
		isDev() {
			return process.env.NODE_ENV === "development";
		},
		recentHeads() {
			if (!this.heads) return null;

			return this.heads.slice(0, 4).sort(a => {
				return a.isActive === true ? -1 : 0;
			});
		}
	},
	created() {
		console.log('Created hook');
		this.updateWebviewId(new Date().valueOf());
		this.handleWindowTransparentStates();
		Mousetrap.bind(["command+l", "ctrl+l"], () => {
			this.logUserOut();
			// return false to prevent default behavior and stop event from bubbling
			return false;
		});
		Mousetrap.bind(["command+d", "ctrl+d"], () => {
			this.showAppVersion = !this.showAppVersion;
			// return false to prevent default behavior and stop event from bubbling
			return false;
		});
		ipcRenderer.on('update_downloaded', () => {
		  ipcRenderer.removeAllListeners('update_downloaded');
		  this.updateAvailable = true;
		});
		this.appVersion = remote.app.getVersion();
	},
	mounted() {
		const webview = document.querySelector("#messengerWebView");
		webview.addEventListener("dom-ready", () => {
			// this.isDev && webview.openDevTools();
			webview.addEventListener("console-message", e => {
				if (e.message.includes("userStatus")) {
					this.updateUserStatus(e.message);
				} else if (e.message.includes("updateChats")) {
					this.updateChats(e.message.split(consoleSplitter)[1]);
				} else if (e.message.includes("loggedUserOut")) {
					this.loading = false;
					this.heads = null;
					this.loggedIn = false;
					this.closedHeads = [];
					this.webviewStatus = null;
					this.headsOpen = false;
					this.checkWindowSize();
				}
			});
		});
		webview.addEventListener("did-start-loading", () => {
			this.webviewStatus = "loading...";
			if (this.loggedIn) return;
			this.isLoading = true;
		});
		webview.addEventListener("did-stop-loading", () => {
			this.webviewStatus = "done";
			this.isLoading = false;
			if (this.loggedIn) return;
			if (!webview) return;
			webview.executeJavaScript(`
				if(document.querySelector('[data-href="https://www.messenger.com/new"]')) {
					console.log('userStatus__loggedIn');
				}
				else {
					console.log('userStatus__loggedOut');
					let rememberInput = document.querySelector('input[name="persistent"]');
					if(rememberInput) rememberInput.click();
				}
			`);
		});
	},
	data: () => ({
		heads: null,
		closedHeads: [],
		loggedIn: null,
		isLoading: false,
		webviewStatus: null,
		headsOpen: false,
		blurListennerAttached: false,
		hideWebView: false,
		newMessageImage: base64AddIcon,
		loggedOutMessage: `Please complete the login procedure in the Messenger.com window below.`,
		updateAvailableMessage: `Click here to update StickyChats`,
		updateAvailable: false,
		appVersion: null,
		showAppVersion: false,
	}),
	methods: {
		...mapActions(['updateWebviewId']),
		updateApp() {
			ipcRenderer.send('restart_app');
		},
		logUserOut() {
			console.log('Logging out function called');
			// need to have the settings button visible
			let win = remote.getCurrentWindow();
			let [width, height] = win.getSize();
			win.setSize(width, 901);

			const webview = document.querySelector("#messengerWebView");
			webview.executeJavaScript(`
				logUserOut();
			`);
		},
		handleWindowTransparentStates() {
			if (this.blurListennerAttached) return;
			let win = remote.getCurrentWindow();
			win.on("blur", () => {
				if (!this.loggedIn) return;
				this.hideWebView = true;
				this.headsOpen = false;
			});
			win.on("focus", () => {
				if (!this.loggedIn) return;
				setTimeout(() => {
					this.hideWebView = false;
				}, 120);
			});
			this.blurListennerAttached = true;
		},
		newMessage() {
			const webview = document.querySelector("#messengerWebView");
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

			const webview = document.querySelector("#messengerWebView");
			webview.executeJavaScript(`
				selectChatHead('${id}');
			`);

			this.headsOpen = false;
		},
		hideChat(id, index) {
			if(!this.isDev) return;
			this.closedHeads.push(id);
		},
		updateUserStatus(message) {
			let newValue = false;
			if (message === "userStatus__loggedIn") {
				newValue = true;
				// update only if these were different to begin with
				if (this.loggedIn !== newValue) this.updateLayout();
			} else if (message === "userStatus__loggedOut") {
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
			const webview = document.querySelector("#messengerWebView");

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
					scrollToBottom()
				}

				function newMessage() {
					let targetForClick = document.querySelector('[data-href="https://www.messenger.com/new"]');
					if(targetForClick) targetForClick.click();
				}

				function logUserOut() {
					let settings = document.querySelector('[aria-label="Settings, help and more"]');
					if(settings) settings.click()
					let logout = document.querySelector('.__MenuItem[role="presentation"]:last-child');
					if(logout) logout.click()
					console.log('loggedUserOut');
				}

				function scrollToBottom() {
					let scrollTarget = document.querySelector('[aria-label="Messages"]');
					if(!scrollTarget) return;
					scrollTarget.scrollIntoView({
						block: 'end',
						behavior: 'smooth'
					})
				}
				
				scrollToBottom();
				scrapChatheads();
			`);
		}
	}
};
</script>
<style lang="scss">
.wrapper {
	background: transparent;
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	position: relative;
	&.logged-out {
		.webview-wrapper {
			margin-right: 0px;
			margin-top: 0px;
			>div {
				margin: 0px;
				border-top-right-radius: 0px;
				border-top-left-radius: 0px;
			}
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

	> div {
		flex-shrink: 0;
		position: absolute;
		top: 0;
		left: 0;
	}

	&.heads-opeen {
		> div {
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
	overflow: hidden;
}

.webview-wrapper {
	flex: 1;
	display: flex;
	margin-right: 200px;
	position: relative;
	justify-content: center;
	padding: 1px;
	pointer-events: all;

	&:before {
		content: "";
		border: solid lighten(#d9d9d9, 10);
		border-width: 0px 15px 15px 0px;
		display: inline-block;
		position: absolute;
		z-index: -1;
		transform: rotate(225deg) translate(-5px, -5px);
		top: 0px;
	}

	> div {
		box-shadow: 0px 0px 1px 1px #d9d9d9;
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

.app-version {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	display: flex;
	justify-content: center;
	font-family: serif;
	font-size: 8px;
	> span {
		background-color: var(--dark-shade);
		border-radius: 10px;
		margin-left: 80px;
		color: var(--yellow);
		padding: 2px;
	}
}

#update-suggestion {
	background-color: var(--theme);
	align-self: center;
	border-radius: 20px;
	color: white;
}
</style>
