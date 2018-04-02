import {
  CLOSE_WINAMP,
  SET_SKIN_DATA,
  START_WORKING,
  STEP_MARQUEE,
  STOP_WORKING,
  TOGGLE_DOUBLESIZE_MODE,
  TOGGLE_LLAMA_MODE,
  TOGGLE_MAIN_SHADE_MODE,
  TOGGLE_EQUALIZER_SHADE_MODE,
  TOGGLE_PLAYLIST_SHADE_MODE,
  TOGGLE_VISUALIZER_STYLE,
  SET_PLAYLIST_SCROLL_POSITION,
  PLAYLIST_SIZE_CHANGED
} from "../actionTypes";

const defaultDisplayState = {
  doubled: false,
  marqueeStep: 0,
  loading: true,
  llama: false,
  closed: false,
  mainShade: false,
  equalizerShade: false,
  playlistShade: false,
  working: false,
  skinImages: {},
  skinColors: null,
  skinCursors: null,
  skinPlaylistStyle: {},
  skinRegion: {},
  visualizerStyle: 2,
  playlistScrollPosition: 0,
  playlistSize: [0, 0]
};

const display = (state = defaultDisplayState, action) => {
  switch (action.type) {
    case TOGGLE_DOUBLESIZE_MODE:
      return { ...state, doubled: !state.doubled };
    case TOGGLE_MAIN_SHADE_MODE:
      return { ...state, mainShade: !state.mainShade };
    case TOGGLE_EQUALIZER_SHADE_MODE:
      return { ...state, equalizerShade: !state.equalizerShade };
    case TOGGLE_PLAYLIST_SHADE_MODE:
      return { ...state, playlistShade: !state.playlistShade };
    case TOGGLE_LLAMA_MODE:
      return { ...state, llama: !state.llama };
    case STEP_MARQUEE:
      // TODO: Prevent this from becoming huge
      return { ...state, marqueeStep: state.marqueeStep + 1 };
    case STOP_WORKING:
      return { ...state, working: false };
    case START_WORKING:
      return { ...state, working: true };
    case CLOSE_WINAMP:
      return { ...state, closed: true };
    case SET_SKIN_DATA:
      return {
        ...state,
        loading: false,
        skinImages: action.skinImages,
        skinColors: action.skinColors,
        skinPlaylistStyle: action.skinPlaylistStyle,
        skinCursors: action.skinCursors,
        skinRegion: action.skinRegion,
        skinGenLetterWidths: action.skinGenLetterWidths
      };
    case TOGGLE_VISUALIZER_STYLE:
      return { ...state, visualizerStyle: (state.visualizerStyle + 1) % 3 };
    case SET_PLAYLIST_SCROLL_POSITION:
      return { ...state, playlistScrollPosition: action.position };
    case PLAYLIST_SIZE_CHANGED:
      return { ...state, playlistSize: action.size };
    default:
      return state;
  }
};

export default display;
