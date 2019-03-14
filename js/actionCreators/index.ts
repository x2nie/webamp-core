import {
  CLOSE_WINAMP,
  OPEN_WINAMP,
  STOP,
  TOGGLE_VISUALIZER_STYLE,
  CLOSE_REQUESTED,
  MINIMIZE_WINAMP,
  SET_FOCUS,
  UNSET_FOCUS,
  LOAD_SERIALIZED_STATE,
  LOAD_DEFAULT_SKIN,
  SET_MILKDROP_DESKTOP
} from "../actionTypes";
import { WINDOWS } from "../constants";
import { Dispatchable } from "../types";
import { ensureWindowsAreOnScreen, showWindow, hideWindow } from "./windows";
import { SerializedStateV1 } from "../serializedStates/v1Types";

export {
  toggleDoubleSizeMode,
  toggleEqualizerShadeMode,
  togglePlaylistShadeMode,
  closeWindow,
  hideWindow,
  showWindow,
  setWindowSize,
  toggleWindow,
  updateWindowPositions,
  toggleMainWindowShadeMode,
  centerWindowsInContainer,
  centerWindowsInView,
  resetWindowSizes,
  browserWindowSizeChanged,
  ensureWindowsAreOnScreen,
  stackWindows,
  toggleLlamaMode,
  setFocusedWindow
} from "./windows";
export {
  play,
  pause,
  stop,
  nextN,
  next,
  previous,
  seekForward,
  seekBackward,
  setVolume,
  adjustVolume,
  scrollVolume,
  setBalance,
  toggleRepeat,
  toggleShuffle,
  toggleTimeMode
} from "./media";
export {
  setEqBand,
  setEqToMax,
  setEqToMid,
  setEqToMin,
  setPreamp,
  toggleEq,
  toggleEqAuto
} from "./equalizer";
export {
  addTracksFromReferences,
  loadFilesFromReferences,
  setSkinFromArrayBuffer,
  setSkinFromFileReference,
  setSkinFromUrl,
  openEqfFileDialog,
  openMediaFileDialog,
  openSkinFileDialog,
  fetchMediaDuration,
  loadMediaFiles,
  loadMediaFile,
  fetchMediaTags,
  setEqFromFileReference,
  downloadPreset,
  setEqFromObject,
  downloadHtmlPlaylist
} from "./files";
export {
  cropPlaylist,
  removeSelectedTracks,
  removeAllTracks,
  reverseList,
  randomizeList,
  sortListByTitle,
  setPlaylistScrollPosition,
  scrollNTracks,
  scrollPlaylistByDelta,
  scrollUpFourTracks,
  scrollDownFourTracks,
  dragSelected
} from "./playlist";
export { initializePresets } from "./milkdrop";

import * as Selectors from "../selectors";

export function close(): Dispatchable {
  return dispatch => {
    // TODO: This could probably be improved by adding a "PREVENT_CLOSE" action
    // or something, but this works okay for now.
    let defaultPrevented = false;
    const cancel = () => {
      defaultPrevented = true;
    };
    dispatch({ type: CLOSE_REQUESTED, cancel });
    if (!defaultPrevented) {
      dispatch({ type: STOP });
      dispatch({ type: CLOSE_WINAMP });
    }
  };
}

export function open(): Dispatchable {
  return { type: OPEN_WINAMP };
}

export function toggleVisualizerStyle(): Dispatchable {
  return { type: TOGGLE_VISUALIZER_STYLE };
}

export function minimize(): Dispatchable {
  return { type: MINIMIZE_WINAMP };
}

export function setFocus(input: string): Dispatchable {
  return { type: SET_FOCUS, input };
}

export function unsetFocus(): Dispatchable {
  return { type: UNSET_FOCUS };
}

export function loadSerializedState(
  // In the future this type should be the union of all versioned types.
  serializedState: SerializedStateV1
): Dispatchable {
  return dispatch => {
    dispatch({ type: LOAD_SERIALIZED_STATE, serializedState });
    dispatch(ensureWindowsAreOnScreen());
  };
}

export function loadDefaultSkin(): Dispatchable {
  return { type: LOAD_DEFAULT_SKIN };
}

export function toggleMilkdropDesktop(): Dispatchable {
  return (dispatch, getState) => {
    if (Selectors.getMilkdropDesktopEnabled(getState())) {
      dispatch(showWindow(WINDOWS.MILKDROP));
      dispatch({ type: SET_MILKDROP_DESKTOP, enabled: false });
    } else {
      dispatch(hideWindow(WINDOWS.MILKDROP));
      dispatch({ type: SET_MILKDROP_DESKTOP, enabled: true });
    }
  };
}
