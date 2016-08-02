import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';

import createReducer from './reducers';

import Browser from './browser';
import MainWindow from './components/MainWindow.jsx';
import Winamp from './winamp';
import Hotkeys from './hotkeys';
import Skin from './components/Skin.jsx';

if (new Browser(window).isCompatible) {
  const winamp = Winamp;
  const store = createStore(
    createReducer(winamp),
    window.devToolsExtension && window.devToolsExtension(),
    applyMiddleware(thunk)
  );

  render(
    <Provider store={store}>
      <div>
        <Skin>
          {/* This is not technically kosher, since <style> tags should be in
          the <head>, but browsers don't really care... */}
        </Skin>
        <MainWindow winamp={winamp} mediaPlayer={winamp.media} />
      </div>
    </Provider>,
    document.getElementById('winamp2-js')
  );

  winamp.dispatch = store.dispatch;

  const cdnUrl = 'https://cdn.rawgit.com/captbaritone/winamp2-js/master/';
  const assetBase = process.env.NODE_ENV === 'production' ? cdnUrl : '';
  winamp.init({
    volume: 50,
    balance: 0,
    mediaFile: {
      url: `${assetBase}mp3/llama-2.91.mp3`,
      name: "1. DJ Mike Llama - Llama Whippin' Intro"
    },
    skinUrl: `${assetBase}skins/base-2.91.wsz`
  });

  new Hotkeys(winamp, store);
} else {
  document.getElementById('winamp').style.display = 'none';
  document.getElementById('browser-compatibility').style.display = 'block';
}
