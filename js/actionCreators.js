import jsmediatags from "jsmediatags/dist/jsmediatags";
import { parser, creator } from "winamp-eqf";
import {
  genArrayBufferFromFileReference,
  genArrayBufferFromUrl,
  promptForFileReferences
} from "./fileUtils";
import skinParser from "./skinParser";
import { BANDS, TRACK_HEIGHT } from "./constants";
import {
  getEqfData,
  nextTrack,
  getScrollOffset,
  getOverflowTrackCount,
  getPlaylistURL,
  getSelectedTrackObjects
} from "./selectors";

import {
  clamp,
  base64FromArrayBuffer,
  downloadURI,
  normalize,
  sort
} from "./utils";
import {
  CLOSE_WINAMP,
  ADD_TRACK_FROM_URL,
  SEEK_TO_PERCENT_COMPLETE,
  SET_BALANCE,
  SET_BAND_VALUE,
  SET_SKIN_DATA,
  SET_VOLUME,
  STOP,
  TOGGLE_REPEAT,
  TOGGLE_SHUFFLE,
  SET_EQ_ON,
  SET_EQ_OFF,
  TOGGLE_EQUALIZER_SHADE_MODE,
  CLOSE_EQUALIZER_WINDOW,
  REMOVE_TRACKS,
  REMOVE_ALL_TRACKS,
  PLAY,
  PAUSE,
  REVERSE_LIST,
  RANDOMIZE_LIST,
  SET_TRACK_ORDER,
  TOGGLE_VISUALIZER_STYLE,
  PLAY_TRACK,
  BUFFER_TRACK,
  SET_PLAYLIST_SCROLL_POSITION,
  DRAG_SELECTED,
  SET_MEDIA_TAGS,
  SET_MEDIA_DURATION,
  TOGGLE_SHADE_MODE,
  TOGGLE_PLAYLIST_SHADE_MODE
} from "./actionTypes";

function playRandomTrack() {
  return (dispatch, getState) => {
    const { playlist: { trackOrder, currentTrack } } = getState();
    let nextId;
    do {
      nextId = trackOrder[Math.floor(trackOrder.length * Math.random())];
    } while (nextId === currentTrack && trackOrder.length > 1);
    // TODO: Sigh... Technically, we should detect if we are looping only repeat if we are.
    // I think this would require pre-computing the "random" order of a playlist.
    dispatch({ type: PLAY_TRACK, id: nextId });
  };
}

export function play() {
  return (dispatch, getState) => {
    const state = getState();
    if (
      state.media.status === "STOPPED" &&
      state.playlist.curentTrack == null &&
      state.playlist.trackOrder.length === 0
    ) {
      dispatch(openFileDialog());
    } else {
      dispatch({ type: PLAY });
    }
  };
}

export function pause() {
  return (dispatch, getState) => {
    const { status } = getState().media;
    dispatch({ type: status === "PLAYING" ? PAUSE : PLAY });
  };
}

export function stop() {
  return { type: STOP };
}

export function nextN(n) {
  return (dispatch, getState) => {
    const state = getState();
    if (state.media.shuffle) {
      dispatch(playRandomTrack());
      return;
    }
    const nextTrackId = nextTrack(state, n);
    if (nextTrackId == null) {
      return;
    }
    dispatch({ type: PLAY_TRACK, id: nextTrackId });
  };
}

export function next() {
  return nextN(1);
}

export function previous() {
  return nextN(-1);
}

export function seekForward(seconds) {
  return function(dispatch, getState) {
    const { media } = getState();
    const { timeElapsed, length } = media;
    const newTimeElapsed = timeElapsed + seconds;
    const newPercentComplete = newTimeElapsed / length;
    dispatch({ type: SEEK_TO_PERCENT_COMPLETE, percent: newPercentComplete });
  };
}

export function seekBackward(seconds) {
  return seekForward(-seconds);
}

export function close() {
  return dispatch => {
    dispatch({ type: STOP });
    dispatch({ type: CLOSE_WINAMP });
  };
}

export function setVolume(volume) {
  return {
    type: SET_VOLUME,
    volume: clamp(volume, 0, 100)
  };
}

export function adjustVolume(volumeDiff) {
  return (dispatch, getState) => {
    const currentVolume = getState().media.volume;
    return dispatch(setVolume(currentVolume + volumeDiff));
  };
}

export function scrollVolume(e) {
  e.preventDefault();
  return (dispatch, getState) => {
    const currentVolume = getState().media.volume;
    // Using pixels as percentage difference here is a bit arbirary, but... oh well.
    return dispatch(setVolume(currentVolume + e.deltaY));
  };
}

export function setBalance(balance) {
  balance = clamp(balance, -100, 100);
  // The balance clips to the center
  if (Math.abs(balance) < 25) {
    balance = 0;
  }
  return {
    type: SET_BALANCE,
    balance
  };
}

export function toggleRepeat() {
  return { type: TOGGLE_REPEAT };
}

export function toggleShuffle() {
  return { type: TOGGLE_SHUFFLE };
}

function setEqFromFileReference(fileReference) {
  return async dispatch => {
    const arrayBuffer = await genArrayBufferFromFileReference(fileReference);
    const eqf = parser(arrayBuffer);
    const preset = eqf.presets[0];

    dispatch(setPreamp(normalize(preset.preamp)));
    BANDS.forEach(band => {
      dispatch(setEqBand(band, normalize(preset[`hz${band}`])));
    });
  };
}

export function addTracksFromReferences(fileReferences, autoPlay, atIndex) {
  return dispatch => {
    if (autoPlay) {
      // I'm the worst. It just so happens that in every case that we autoPlay,
      // we should also clear all tracks.
      dispatch(removeAllTracks());
    }
    Array.from(fileReferences).forEach((file, i) => {
      const priority = i === 0 && autoPlay ? "PLAY" : "NONE";
      const id = uniqueId();
      const url = URL.createObjectURL(file);
      dispatch(_addTrackFromUrl(url, file.name, id, priority, atIndex + i));
      dispatch(fetchMediaTags(file, id));
    });
  };
}

const SKIN_FILENAME_MATCHER = new RegExp("(wsz|zip)$", "i");
const EQF_FILENAME_MATCHER = new RegExp("eqf$", "i");
export function loadFilesFromReferences(
  fileReferences,
  autoPlay = true,
  atIndex = null
) {
  return dispatch => {
    if (fileReferences.length < 1) {
      return;
    } else if (fileReferences.length === 1) {
      const fileReference = fileReferences[0];
      if (SKIN_FILENAME_MATCHER.test(fileReference.name)) {
        dispatch(setSkinFromFileReference(fileReference));
        return;
      } else if (EQF_FILENAME_MATCHER.test(fileReference.name)) {
        dispatch(setEqFromFileReference(fileReference));
        return;
      }
    }
    dispatch(addTracksFromReferences(fileReferences, autoPlay, atIndex));
  };
}

export function fetchMediaDuration(url, id) {
  return dispatch => {
    // TODO: Does this actually stop downloading the file once it's
    // got the duration?
    const audio = document.createElement("audio");
    const durationChange = () => {
      const { duration } = audio;
      dispatch({ type: SET_MEDIA_DURATION, duration, id });
      audio.removeEventListener("durationchange", durationChange);
    };
    audio.addEventListener("durationchange", durationChange);
    audio.src = url;
  };
}

let counter = 0;
function uniqueId() {
  return counter++;
}

function _addTrackFromUrl(url, name, id, priority, atIndex) {
  return dispatch => {
    dispatch({ type: ADD_TRACK_FROM_URL, url, name, id, atIndex });
    switch (priority) {
      case "BUFFER":
        dispatch({ type: BUFFER_TRACK, name, id });
        break;
      case "PLAY":
        dispatch({ type: PLAY_TRACK, name, id });
        break;
      default:
        // If we're not going to load this right away,
        // we should fetch duration on our own
        dispatch(fetchMediaDuration(url, id));
    }
  };
}

export function loadMediaFromUrl(url, name, priority) {
  return dispatch => {
    const id = uniqueId();
    dispatch(_addTrackFromUrl(url, name, id, priority));
    dispatch(fetchMediaTags(url, id));
  };
}

export function fetchMediaTags(file, id) {
  // Workaround https://github.com/aadsm/jsmediatags/issues/83
  if (typeof file === "string" && !/^[a-z]+:\/\//i.test(file)) {
    file = `${location.protocol}//${location.host}${location.pathname}${file}`;
  }
  return dispatch => {
    try {
      jsmediatags.read(file, {
        onSuccess: data => {
          const { artist, title } = data.tags;
          // There's more data here, but we don't have a use for it yet:
          // https://github.com/aadsm/jsmediatags#shortcuts
          dispatch({ type: SET_MEDIA_TAGS, artist, title, id });
        },
        onError: () => {
          // Nothing to do. The filename will have to suffice.
        }
      });
    } catch (e) {
      // Possibly jsmediatags could not find a parser for this file?
      // Nothing to do.
      // Consider removing this after https://github.com/aadsm/jsmediatags/issues/83 is resolved.
    }
  };
}

export function setSkinFromArrayBuffer(arrayBuffer) {
  return async dispatch => {
    const skinData = await skinParser(arrayBuffer);
    dispatch({
      type: SET_SKIN_DATA,
      skinImages: skinData.images,
      skinColors: skinData.colors,
      skinPlaylistStyle: skinData.playlistStyle,
      skinCursors: skinData.cursors,
      skinRegion: skinData.region,
      skinGenLetterWidths: skinData.genLetterWidths
    });
  };
}

export function setSkinFromFileReference(skinFileReference) {
  return async dispatch => {
    const arrayBuffer = await genArrayBufferFromFileReference(
      skinFileReference
    );
    dispatch(setSkinFromArrayBuffer(arrayBuffer));
  };
}

export function setSkinFromUrl(url) {
  return async dispatch => {
    const arrayBuffer = await genArrayBufferFromUrl(url);
    dispatch(setSkinFromArrayBuffer(arrayBuffer));
  };
}

export function openFileDialog(accept) {
  return async dispatch => {
    const fileReferences = await promptForFileReferences(accept);
    dispatch(loadFilesFromReferences(fileReferences));
  };
}

export function setEqBand(band, value) {
  return { type: SET_BAND_VALUE, band, value };
}

function _setEqTo(value) {
  return dispatch => {
    Object.keys(BANDS).forEach(key => {
      const band = BANDS[key];
      dispatch({
        type: SET_BAND_VALUE,
        value,
        band
      });
    });
  };
}

export function setEqToMax() {
  return _setEqTo(100);
}

export function setEqToMid() {
  return _setEqTo(50);
}

export function setEqToMin() {
  return _setEqTo(0);
}

export function setPreamp(value) {
  return {
    type: SET_BAND_VALUE,
    band: "preamp",
    value
  };
}

export function toggleEq() {
  return (dispatch, getState) => {
    const type = getState().equalizer.on ? SET_EQ_OFF : SET_EQ_ON;
    dispatch({ type });
  };
}

export function downloadPreset() {
  return (dispatch, getState) => {
    const state = getState();
    const data = getEqfData(state);
    const arrayBuffer = creator(data);
    const base64 = base64FromArrayBuffer(arrayBuffer);
    const dataURI = `data:application/zip;base64,${base64}`;
    downloadURI(dataURI, "entry.eqf");
  };
}

export function toggleEqualizerShadeMode() {
  return { type: TOGGLE_EQUALIZER_SHADE_MODE };
}

export function toggleMainWindowShadeMode() {
  return { type: TOGGLE_SHADE_MODE };
}

export function togglePlaylistShadeMode() {
  return { type: TOGGLE_PLAYLIST_SHADE_MODE };
}

export function closeEqualizerWindow() {
  return { type: CLOSE_EQUALIZER_WINDOW };
}

export function cropPlaylist() {
  return (dispatch, getState) => {
    const state = getState();
    if (getSelectedTrackObjects(state).length === 0) {
      return;
    }
    const { playlist: { tracks } } = getState();
    dispatch({
      type: REMOVE_TRACKS,
      ids: Object.keys(tracks).filter(id => !tracks[id].selected)
    });
  };
}

export function removeSelectedTracks() {
  return (dispatch, getState) => {
    const { playlist: { tracks } } = getState();
    dispatch({
      type: REMOVE_TRACKS,
      ids: Object.keys(tracks).filter(id => tracks[id].selected)
    });
  };
}

export function removeAllTracks() {
  return { type: REMOVE_ALL_TRACKS };
}

export function reverseList() {
  return { type: REVERSE_LIST };
}

export function randomizeList() {
  return { type: RANDOMIZE_LIST };
}

export function sortListByTitle() {
  return (dispatch, getState) => {
    const state = getState();
    const trackOrder = sort(state.playlist.trackOrder, i =>
      `${state.playlist.tracks[i].title}`.toLowerCase()
    );
    return dispatch({ type: SET_TRACK_ORDER, trackOrder });
  };
}

export function toggleVisualizerStyle() {
  return { type: TOGGLE_VISUALIZER_STYLE };
}

export function setPlaylistScrollPosition(position) {
  return { type: SET_PLAYLIST_SCROLL_POSITION, position };
}

export function scrollNTracks(n) {
  return (dispatch, getState) => {
    const state = getState();
    const overflow = getOverflowTrackCount(state);
    const currentOffset = getScrollOffset(state);
    const position = overflow ? clamp((currentOffset + n) / overflow, 0, 1) : 0;
    return dispatch({
      type: SET_PLAYLIST_SCROLL_POSITION,
      position: position * 100
    });
  };
}

export function scrollPlaylistByDelta(e) {
  e.preventDefault();
  return (dispatch, getState) => {
    const state = getState();
    if (getOverflowTrackCount(state)) {
      e.stopPropagation();
    }
    const totalPixelHeight = state.playlist.trackOrder.length * TRACK_HEIGHT;
    const percentDelta = e.deltaY / totalPixelHeight * 100;
    dispatch({
      type: SET_PLAYLIST_SCROLL_POSITION,
      position: clamp(
        state.display.playlistScrollPosition + percentDelta,
        0,
        100
      )
    });
  };
}

export function scrollUpFourTracks() {
  return scrollNTracks(-4);
}

export function scrollDownFourTracks() {
  return scrollNTracks(4);
}

function findLastIndex(arr, cb) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (cb(arr[i])) {
      return i;
    }
  }
  return -1;
}

export function dragSelected(offset) {
  return (dispatch, getState) => {
    const { playlist: { trackOrder, tracks } } = getState();
    const firstSelected = trackOrder.findIndex(
      trackId => tracks[trackId] && tracks[trackId].selected
    );
    if (firstSelected === -1) {
      return;
    }
    const lastSelected = findLastIndex(
      trackOrder,
      trackId => tracks[trackId] && tracks[trackId].selected
    );
    if (lastSelected === -1) {
      throw new Error("We found a first selected, but not a last selected.");
    }
    // Ensure we don't try to drag off either end.
    const min = -firstSelected;
    const max = trackOrder.length - 1 - lastSelected;
    const normalizedOffset = clamp(offset, min, max);
    if (normalizedOffset !== 0) {
      dispatch({ type: DRAG_SELECTED, offset: normalizedOffset });
    }
  };
}

export function downloadHtmlPlaylist() {
  return (dispatch, getState) => {
    const uri = getPlaylistURL(getState());
    downloadURI(uri, "Winamp Playlist.html");
  };
}
