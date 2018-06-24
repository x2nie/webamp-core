import { createSelector } from "reselect";

import {
  CLOSE_WINAMP,
  SET_SKIN_DATA,
  START_WORKING,
  STEP_MARQUEE,
  STOP_WORKING,
  TOGGLE_DOUBLESIZE_MODE,
  TOGGLE_LLAMA_MODE,
  TOGGLE_VISUALIZER_STYLE,
  SET_PLAYLIST_SCROLL_POSITION,
  LOADED,
  REGISTER_VISUALIZER,
  SET_Z_INDEX
} from "../actionTypes";
import { DEFAULT_SKIN, VISUALIZER_ORDER } from "../constants";

export const getVisualizationOrder = state => {
  return [...state.additionalVisualizers, ...VISUALIZER_ORDER];
};

export const getVisualizerStyle = createSelector(
  getVisualizationOrder,
  state => state.visualizerStyle,
  (visualizationOrder, visualizationStyle) => {
    return visualizationOrder[visualizationStyle];
  }
);

const defaultDisplayState = {
  doubled: false,
  marqueeStep: 0,
  loading: true,
  llama: false,
  closed: false,
  working: false,
  skinImages: DEFAULT_SKIN.images,
  skinColors: DEFAULT_SKIN.colors,
  skinCursors: null,
  skinPlaylistStyle: null,
  skinRegion: {},
  visualizerStyle: 0, // Index into VISUALIZER_ORDER
  playlistScrollPosition: 0,
  skinGenLetterWidths: null, // TODO: Get the default value for this?
  additionalVisualizers: [],
  zIndex: 0
};

const display = (state = defaultDisplayState, action) => {
  switch (action.type) {
    case TOGGLE_DOUBLESIZE_MODE:
      return { ...state, doubled: !state.doubled };
    case TOGGLE_LLAMA_MODE:
      return { ...state, llama: !state.llama };
    case STEP_MARQUEE:
      return { ...state, marqueeStep: state.marqueeStep + 1 };
    case STOP_WORKING:
      return { ...state, working: false };
    case START_WORKING:
      return { ...state, working: true };
    case CLOSE_WINAMP:
      return { ...state, closed: true };
    case LOADED:
      return { ...state, loading: false };
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
      return {
        ...state,
        visualizerStyle:
          (state.visualizerStyle + 1) % getVisualizationOrder(state).length
      };
    case REGISTER_VISUALIZER:
      return {
        ...state,
        additionalVisualizers: [action.id, ...state.additionalVisualizers]
      };
    case SET_PLAYLIST_SCROLL_POSITION:
      return { ...state, playlistScrollPosition: action.position };
    case SET_Z_INDEX:
      return { ...state, zIndex: action.zIndex };
    default:
      return state;
  }
};
export default display;
