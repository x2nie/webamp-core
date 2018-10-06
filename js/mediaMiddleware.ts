import Media from "./media";
import {
  IS_PLAYING,
  IS_STOPPED,
  PAUSE,
  PLAY,
  SEEK_TO_PERCENT_COMPLETE,
  SET_BAND_VALUE,
  SET_BALANCE,
  SET_MEDIA,
  SET_VOLUME,
  START_WORKING,
  STOP,
  STOP_WORKING,
  UPDATE_TIME_ELAPSED,
  SET_EQ_OFF,
  SET_EQ_ON,
  PLAY_TRACK,
  BUFFER_TRACK,
  CHANNEL_COUNT_CHANGED,
  LOAD_SERIALIZED_STATE
} from "./actionTypes";
import { next as nextTrack } from "./actionCreators";
import * as Selectors from "./selectors";
import {
  MiddlewareStore,
  Dispatchable,
  Action,
  Dispatch,
  Slider
} from "./types";
import { objectForEach } from "./utils";

export default (media: Media) => (store: MiddlewareStore) => {
  const {
    media: { volume, balance }
  } = store.getState();

  // Ensure the default state is the canonical value.
  media.setVolume(volume);
  media.setBalance(balance);
  // TODO: Ensure other values like bands and preamp are in sync

  media.on("timeupdate", () => {
    store.dispatch({
      type: UPDATE_TIME_ELAPSED,
      elapsed: media.timeElapsed()
    });
  });

  media.on("ended", () => {
    store.dispatch({ type: IS_STOPPED });
    store.dispatch(nextTrack());
  });

  media.on("playing", () => {
    store.dispatch({ type: IS_PLAYING });
  });

  media.on("waiting", () => {
    store.dispatch({ type: START_WORKING });
  });

  media.on("stopWaiting", () => {
    store.dispatch({ type: STOP_WORKING });
  });

  media.on("fileLoaded", () => {
    const id = Selectors.getCurrentTrackId(store.getState());
    if (id == null) {
      // Attempted to set the metadata for a track that was already removed.
      // Really, the media should have been stopped when the track was removed.
      return;
    }
    store.dispatch({
      id,
      type: SET_MEDIA,
      kbps: "128",
      khz: Math.round(media.sampleRate() / 1000).toString(),
      channels: media.channels(),
      length: media.duration()
    });
  });

  media.on("channelupdate", () => {
    store.dispatch({
      type: CHANNEL_COUNT_CHANGED,
      channels: media.channels()
    });
  });

  return (next: Dispatch) => (action: Action) => {
    const returnValue = next(action);
    const state = store.getState();
    switch (action.type) {
      case PLAY:
        media.play();
        break;
      case PAUSE:
        media.pause();
        break;
      case STOP:
        media.stop();
        break;
      case SET_VOLUME:
        media.setVolume(Selectors.getVolume(state));
        break;
      case SET_BALANCE:
        media.setBalance(Selectors.getBalance(state));
        break;
      case SEEK_TO_PERCENT_COMPLETE:
        media.seekToPercentComplete(action.percent);
        break;
      case PLAY_TRACK: {
        const track = store.getState().playlist.tracks[action.id];
        if (track != null) {
          media.loadFromUrl(track.url, true);
        }
        break;
      }
      case BUFFER_TRACK: {
        const track = store.getState().playlist.tracks[action.id];
        if (track != null) {
          media.loadFromUrl(track.url, false);
        }
        break;
      }
      case SET_BAND_VALUE:
        if (action.band === "preamp") {
          media.setPreamp(action.value);
        } else {
          media.setEqBand(action.band, action.value);
        }
        break;
      case SET_EQ_OFF:
        media.disableEq();
        break;
      case SET_EQ_ON:
        media.enableEq();
        break;
      case LOAD_SERIALIZED_STATE: {
        // Set ALL THE THINGS!
        if (Selectors.getEqualizerEnabled(state)) {
          media.enableEq();
        } else {
          media.disableEq();
        }
        media.setVolume(Selectors.getVolume(state));
        media.setBalance(Selectors.getBalance(state));
        objectForEach(state.equalizer.sliders, (value, slider) => {
          if (slider === "preamp") {
            media.setPreamp(value);
          } else {
            // @ts-ignore I don't know how to teach TypeScript about objects
            // that use Slider as keys
            media.setEqBand(slider, value);
          }
        });
        break;
      }
    }
    return returnValue;
  };
};
