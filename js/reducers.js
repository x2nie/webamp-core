import { combineReducers } from "redux";
import { BANDS, WINDOWS } from "./constants";
import {
  CLOSE_WINAMP,
  SET_BALANCE,
  SET_BAND_VALUE,
  SET_FOCUS,
  SET_BAND_FOCUS,
  SET_FOCUSED_WINDOW,
  SET_MEDIA,
  SET_SCRUB_POSITION,
  SET_SKIN_DATA,
  SET_VOLUME,
  START_LOADING,
  START_WORKING,
  STEP_MARQUEE,
  STOP_WORKING,
  TOGGLE_DOUBLESIZE_MODE,
  TOGGLE_EQUALIZER_WINDOW,
  CLOSE_EQUALIZER_WINDOW,
  TOGGLE_PLAYLIST_WINDOW,
  SET_EQ_AUTO,
  SET_EQ_ON,
  SET_EQ_OFF,
  TOGGLE_LLAMA_MODE,
  TOGGLE_REPEAT,
  TOGGLE_SHADE_MODE,
  TOGGLE_EQUALIZER_SHADE_MODE,
  TOGGLE_SHUFFLE,
  TOGGLE_TIME_MODE,
  TOGGLE_VISUALIZER_STYLE,
  UNSET_FOCUS,
  UPDATE_TIME_ELAPSED
} from "./actionTypes";
import { equalizerEnabled, playlistEnabled } from "./config";

const defaultUserInput = {
  focus: null,
  bandFocused: null,
  scrubPosition: 0
};

export const userInput = (state = defaultUserInput, action) => {
  switch (action.type) {
    case SET_FOCUS:
      return { ...state, focus: action.input, bandFocused: null };
    case SET_BAND_FOCUS:
      return { ...state, focus: action.input, bandFocused: action.bandFocused };
    case UNSET_FOCUS:
      return { ...state, focus: null, bandFocused: null };
    case SET_SCRUB_POSITION:
      return { ...state, scrubPosition: action.position };
    default:
      return state;
  }
};

const defaultWindowsState = {
  focused: WINDOWS.MAIN,
  equalizer: equalizerEnabled,
  playlist: playlistEnabled
};

const windows = (state = defaultWindowsState, action) => {
  switch (action.type) {
    case SET_FOCUSED_WINDOW:
      return { ...state, focused: action.window };
    case TOGGLE_EQUALIZER_WINDOW:
      if (!equalizerEnabled) {
        return state;
      }
      return { ...state, equalizer: !state.equalizer };
    case CLOSE_EQUALIZER_WINDOW:
      return { ...state, equalizer: false };
    case TOGGLE_PLAYLIST_WINDOW:
      if (!playlistEnabled) {
        return state;
      }
      return { ...state, playlist: !state.playlist };
    default:
      return state;
  }
};

const defaultDisplayState = {
  doubled: false,
  marqueeStep: 0,
  loading: true,
  llama: false,
  closed: false,
  shade: false,
  equalizerShade: false,
  working: false,
  skinImages: {},
  skinColors: null,
  skinPlaylistStyle: {},
  visualizerStyle: 2
};

const display = (state = defaultDisplayState, action) => {
  switch (action.type) {
    case TOGGLE_DOUBLESIZE_MODE:
      return { ...state, doubled: !state.doubled };
    case TOGGLE_SHADE_MODE:
      return { ...state, shade: !state.shade };
    case TOGGLE_EQUALIZER_SHADE_MODE:
      return { ...state, equalizerShade: !state.equalizerShade };
    case TOGGLE_LLAMA_MODE:
      return { ...state, llama: !state.llama };
    case STEP_MARQUEE:
      // TODO: Prevent this from becoming huge
      return { ...state, marqueeStep: state.marqueeStep + 1 };
    case STOP_WORKING:
      return { ...state, working: false };
    case START_WORKING:
      return { ...state, working: true };
    case START_LOADING:
      return { ...state, loading: true };
    case CLOSE_WINAMP:
      return { ...state, closed: true };
    case SET_SKIN_DATA:
      return {
        ...state,
        loading: false,
        skinImages: action.skinImages,
        skinColors: action.skinColors,
        skinPlaylistStyle: action.skinPlaylistStyle
      };
    case TOGGLE_VISUALIZER_STYLE:
      return { ...state, visualizerStyle: (state.visualizerStyle + 1) % 3 };
    default:
      return state;
  }
};

const equalizer = (state, action) => {
  if (!state) {
    state = {
      on: true,
      auto: false,
      sliders: {
        preamp: 50
      }
    };
    BANDS.forEach(band => {
      state.sliders[band] = 50;
    });
    return state;
  }
  switch (action.type) {
    case SET_BAND_VALUE:
      const newSliders = { ...state.sliders, [action.band]: action.value };
      return { ...state, sliders: newSliders };
    case SET_EQ_ON:
      return { ...state, on: true };
    case SET_EQ_OFF:
      return { ...state, on: false };
    case SET_EQ_AUTO:
      return { ...state, auto: action.value };
    default:
      return state;
  }
};

const media = (state, action) => {
  if (!state) {
    return {
      timeMode: "ELAPSED",
      timeElapsed: 0,
      length: null, // Consider renaming to "duration"
      kbps: null,
      khz: null,
      volume: 50,
      balance: 0,
      name: "",
      channels: null,
      shuffle: false,
      repeat: false,
      // TODO: Enforce possible values
      status: "STOPPED"
    };
  }
  switch (action.type) {
    case "PLAY":
    case "IS_PLAYING":
      return { ...state, status: "PLAYING" };
    case "PAUSE":
      return { ...state, status: "PAUSED" };
    case "STOP":
    case "IS_STOPPED":
      return { ...state, status: "STOPPED" };
    case TOGGLE_TIME_MODE:
      const newMode = state.timeMode === "REMAINING" ? "ELAPSED" : "REMAINING";
      return { ...state, timeMode: newMode };
    case UPDATE_TIME_ELAPSED:
      return { ...state, timeElapsed: action.elapsed };
    case SET_MEDIA:
      return {
        ...state,
        length: action.length,
        kbps: action.kbps,
        khz: action.khz,
        channels: action.channels,
        name: action.name
      };
    case SET_VOLUME:
      return { ...state, volume: action.volume };
    case SET_BALANCE:
      return { ...state, balance: action.balance };
    case TOGGLE_REPEAT:
      return { ...state, repeat: !state.repeat };
    case TOGGLE_SHUFFLE:
      return { ...state, shuffle: !state.shuffle };
    default:
      return state;
  }
};

const reducer = combineReducers({
  userInput,
  windows,
  display,
  equalizer,
  media
});

export default reducer;
