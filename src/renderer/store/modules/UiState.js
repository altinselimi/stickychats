const state = {
  webviewId: null,
  lastInteractionTimestamp: null
}

const mutations = {
  SET_WEBVIEW_ID (state, payload) {
    state.webviewId = payload;
  },
  SET_LAST_INTERACTION (state, payload) {
    state.lastInteractionTimestamp = payload;
  },
}

const actions = {
  updateWebviewId ({ commit }, payload) {
    commit('SET_WEBVIEW_ID', payload);
  },
  updateLastInteraction({ commit }, payload) {
    commit('SET_LAST_INTERACTION', payload);
  }
}

const getters = {
  getWebviewID(state) {
    return state.webviewId;
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
