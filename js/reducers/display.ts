import {
  Action,
  SkinImages,
  Cursors,
  SkinRegion,
  GenLetterWidths,
  PlaylistStyle
} from "../types";
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
  SET_Z_INDEX,
  DISABLE_MARQUEE,
  SET_DUMMY_VIZ_DATA,
  LOADING,
  LOAD_SERIALIZED_STATE
} from "../actionTypes";
import { DEFAULT_SKIN, VISUALIZER_ORDER } from "../constants";

export interface DisplayState {
  additionalVisualizers: Array<string>;
  visualizerStyle: number;
  doubled: boolean;
  llama: boolean;
  disableMarquee: boolean;
  marqueeStep: number;
  skinImages: SkinImages;
  skinCursors: Cursors | null;
  skinRegion: SkinRegion;
  skinGenLetterWidths: GenLetterWidths | null;
  skinColors: string[]; // Theoretically this could be a tuple of a specific length
  skinPlaylistStyle: PlaylistStyle | null;
  working: boolean;
  closed: boolean;
  loading: boolean;
  playlistScrollPosition: number;
  zIndex: number;
  dummyVizData: null; // TODO: Figure out what kind of data this actually is.
}

export interface DisplaySerializedStateV1 {
  visualizerStyle: number;
  doubled: boolean;
  llama: boolean;
  marqueeStep: number;
  skinImages: SkinImages;
  skinCursors: Cursors | null;
  skinRegion: SkinRegion;
  skinGenLetterWidths: GenLetterWidths | null;
  skinColors: string[]; // Theoretically this could be a tuple of a specific length
  skinPlaylistStyle: PlaylistStyle | null;
}

const defaultDisplayState = {
  doubled: false,
  marqueeStep: 0,
  disableMarquee: false,
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
  dummyVizData: null,
  playlistScrollPosition: 0,
  skinGenLetterWidths: null, // TODO: Get the default value for this?
  additionalVisualizers: [],
  zIndex: 0
};

const display = (
  state: DisplayState = defaultDisplayState,
  action: Action
): DisplayState => {
  switch (action.type) {
    case TOGGLE_DOUBLESIZE_MODE:
      return { ...state, doubled: !state.doubled };
    case TOGGLE_LLAMA_MODE:
      return { ...state, llama: !state.llama };
    case STEP_MARQUEE:
      return state.disableMarquee
        ? state
        : { ...state, marqueeStep: state.marqueeStep + 1 };
    case DISABLE_MARQUEE:
      return { ...state, disableMarquee: true };
    case STOP_WORKING:
      return { ...state, working: false };
    case START_WORKING:
      return { ...state, working: true };
    case CLOSE_WINAMP:
      return { ...state, closed: true };
    case LOADING:
      return { ...state, loading: true };
    case LOADED:
      return { ...state, loading: false };
    case SET_SKIN_DATA:
      const { data } = action;
      return {
        ...state,
        loading: false,
        skinImages: data.skinImages,
        skinColors: data.skinColors,
        skinPlaylistStyle: data.skinPlaylistStyle,
        skinCursors: data.skinCursors,
        skinRegion: data.skinRegion,
        skinGenLetterWidths: data.skinGenLetterWidths
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
    case SET_DUMMY_VIZ_DATA:
      return { ...state, dummyVizData: action.data };
    case LOAD_SERIALIZED_STATE:
      return { ...state, ...action.serializedState.display };
    default:
      return state;
  }
};
export default display;

export const getSerializedState = (
  state: DisplayState
): DisplaySerializedStateV1 => {
  // My kingdom for a type-safe `_.pick`.
  const {
    visualizerStyle,
    doubled,
    llama,
    marqueeStep,
    skinImages,
    skinCursors,
    skinRegion,
    skinGenLetterWidths,
    skinColors,
    skinPlaylistStyle
  } = state;
  return {
    visualizerStyle,
    doubled,
    llama,
    marqueeStep,
    skinImages,
    skinCursors,
    skinRegion,
    skinGenLetterWidths,
    skinColors,
    skinPlaylistStyle
  };
};

export const getVisualizationOrder = (state: DisplayState): Array<string> => {
  return [...state.additionalVisualizers, ...VISUALIZER_ORDER];
};

export const getVisualizerStyle = createSelector(
  getVisualizationOrder,
  state => state.visualizerStyle,
  (visualizationOrder, visualizationStyle) => {
    return visualizationOrder[visualizationStyle];
  }
);
