import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";

import getStore from "./store";
import App from "./components/App";
import Hotkeys from "./hotkeys";
import Media from "./media";
import { setSkinFromUrl, loadMediaFromUrl } from "./actionCreators";

import { SET_AVALIABLE_SKINS } from "./actionTypes";

// Return a promise that resolves when the store matches a predicate.
const storeHas = (store, predicate) =>
  new Promise(resolve => {
    if (predicate(store.getState())) {
      resolve();
      return;
    }
    const unsubscribe = store.subscribe(() => {
      if (predicate(store.getState())) {
        resolve();
        unsubscribe();
      }
    });
  });

class Winamp {
  static browserIsSupported() {
    const supportsAudioApi = !!(
      window.AudioContext || window.webkitAudioContext
    );
    const supportsCanvas = !!window.document.createElement("canvas").getContext;
    const supportsPromises = typeof Promise !== "undefined";
    return supportsAudioApi && supportsCanvas && supportsPromises;
  }

  constructor(options) {
    this.options = options;

    this.media = new Media();
    this.store = getStore(this.media, this.options.__initialState);

    this.store.dispatch(setSkinFromUrl(this.options.initialSkin.url));

    if (this.options.initialTrack && this.options.initialTrack.url) {
      this.store.dispatch(
        loadMediaFromUrl(
          this.options.initialTrack.url,
          this.options.initialTrack.name,
          "BUFFER"
        )
      );
    }
    if (this.options.avaliableSkins) {
      this.store.dispatch({
        type: SET_AVALIABLE_SKINS,
        skins: this.options.avaliableSkins
      });
    }

    new Hotkeys(this.store.dispatch);
  }

  async renderWhenReady(node) {
    // Wait for the skin to load.
    await storeHas(this.store, state => !state.display.loading);

    render(
      <Provider store={this.store}>
        <App media={this.media} />
      </Provider>,
      node
    );
  }
}

export default Winamp;
module.exports = Winamp;
