import { PlaylistState } from "./reducers/playlist";
import { SettingsState } from "./reducers/settings";
import { UserInputState } from "./reducers/userInput";
import { MediaState } from "./reducers/media";
import { DisplayState } from "./reducers/display";
import { WindowsState, WindowPositions } from "./reducers/windows";
import { EqualizerState } from "./reducers/equalizer";
import { NetworkState } from "./reducers/network";
import { SerializedStateV1 } from "./serializedStates/v1Types";

export {
  WebampWindow,
  WindowInfo,
  WindowPosition,
  WindowPositions
} from "./reducers/windows";

export type Skin = {
  url: string;
  name: string;
};

export type Band =
  | 60
  | 170
  | 310
  | 600
  | 1000
  | 3000
  | 6000
  | 12000
  | 14000
  | 16000;

export type Slider = Band | "preamp";

// TODO: Use a type to ensure these keys mirror the CURSORS constant in
// skinParser.js
export type Cursors = { [cursor: string]: string };

export type GenLetterWidths = { [letter: string]: number };

// TODO: Use a type to ensure the keys are one of the known values in PLEDIT.txt
export type PlaylistStyle = { [state: string]: string };

// TODO: Type these keys.
export type SkinImages = { [sprite: string]: string };

// TODO: type these keys
export type SkinRegion = { [windowName: string]: string[] };

export type WindowId = string;

// TODO: Fill these out once we actually use them.
type SkinData = {
  skinImages: SkinImages;
  skinColors: string[];
  skinPlaylistStyle: PlaylistStyle;
  skinCursors: Cursors;
  skinRegion: SkinRegion;
  skinGenLetterWidths: GenLetterWidths;
};

export type Action =
  | {
      type: "@@init";
    }
  | {
      type: "NETWORK_CONNECTED";
    }
  | {
      type: "NETWORK_DISCONNECTED";
    }
  | {
      type: "SET_AVAILABLE_SKINS";
      skins: Array<Skin>;
    }
  | {
      type: "PLAY";
    }
  | {
      type: "IS_PLAYING";
    }
  | {
      type: "PAUSE";
    }
  | {
      type: "STOP";
    }
  | {
      type: "IS_STOPPED";
    }
  | {
      type: "CHANNEL_COUNT_CHANGED";
      channels: number;
    }
  | {
      type: "TOGGLE_TIME_MODE";
    }
  | {
      type: "UPDATE_TIME_ELAPSED";
      elapsed: number;
    }
  | {
      type: "ADD_TRACK_FROM_URL";
      atIndex: number | null;
      id: number;
      defaultName?: string;
      duration?: number;
      url: string;
    }
  | {
      type: "SET_MEDIA";
      id: number;
      length: number;
      kbps: string;
      khz: string;
      channels: number;
    }
  | {
      type: "SET_VOLUME";
      volume: number;
    }
  | {
      type: "SET_BALANCE";
      balance: number;
    }
  | {
      type: "TOGGLE_REPEAT";
    }
  | {
      type: "TOGGLE_SHUFFLE";
    }
  | {
      type: "SET_FOCUS";
      input: string;
    }
  | {
      type: "SET_BAND_FOCUS";
      input: string;
      bandFocused: Band;
    }
  | {
      type: "UNSET_FOCUS";
    }
  | {
      type: "SET_SCRUB_POSITION";
      position: number;
    }
  | {
      type: "SET_USER_MESSAGE";
      message: string;
    }
  | {
      type: "UNSET_USER_MESSAGE";
    }
  | {
      type: "TOGGLE_DOUBLESIZE_MODE";
    }
  | {
      type: "TOGGLE_LLAMA_MODE";
    }
  | {
      type: "STEP_MARQUEE";
    }
  | {
      type: "DISABLE_MARQUEE";
    }
  | {
      type: "STOP_WORKING";
    }
  | {
      type: "START_WORKING";
    }
  | {
      type: "CLOSE_WINAMP";
    }
  | {
      type: "LOADING";
    }
  | {
      type: "LOADED";
    }
  | {
      type: "SET_SKIN_DATA";
      data: SkinData;
    }
  | {
      type: "TOGGLE_VISUALIZER_STYLE";
    }
  | {
      type: "REGISTER_VISUALIZER";
      id: string;
    }
  | {
      type: "SET_PLAYLIST_SCROLL_POSITION";
      position: number;
    }
  | {
      type: "SET_Z_INDEX";
      zIndex: number;
    }
  | {
      type: "SET_DUMMY_VIZ_DATA";
      data: null;
    }
  | {
      type: "SET_BAND_VALUE";
      band: Slider;
      value: number;
    }
  | {
      type: "SET_EQ_ON";
    }
  | {
      type: "SET_EQ_OFF";
    }
  | {
      type: "SET_EQ_AUTO";
      value: boolean;
    }
  | {
      type: "SET_FOCUSED_WINDOW";
      window: WindowId;
    }
  | {
      type: "TOGGLE_WINDOW_SHADE_MODE";
      windowId: WindowId;
    }
  | {
      type: "TOGGLE_WINDOW";
      windowId: WindowId;
    }
  | {
      type: "CLOSE_WINDOW";
      windowId: WindowId;
    }
  | {
      type: "SET_WINDOW_VISIBILITY";
      windowId: WindowId;
      hidden: boolean;
    }
  | {
      type: "ADD_GEN_WINDOW";
      windowId: WindowId;
      title: string;
      open: boolean;
    }
  | {
      type: "WINDOW_SIZE_CHANGED";
      windowId: WindowId;
      size: [number, number];
    }
  | {
      type: "UPDATE_WINDOW_POSITIONS";
      positions: WindowPositions;
      absolute?: boolean;
    }
  | {
      type: "CLICKED_TRACK";
      index: number;
    }
  | {
      type: "CTRL_CLICKED_TRACK";
      index: number;
    }
  | {
      type: "SHIFT_CLICKED_TRACK";
      index: number;
    }
  | {
      type: "SELECT_ALL";
    }
  | {
      type: "SELECT_ZERO";
    }
  | {
      type: "INVERT_SELECTION";
    }
  | {
      type: "REMOVE_ALL_TRACKS";
    }
  | {
      type: "REMOVE_TRACKS";
      ids: string[];
    }
  | {
      type: "REVERSE_LIST";
    }
  | {
      type: "RANDOMIZE_LIST";
    }
  | {
      type: "SET_TRACK_ORDER";
      trackOrder: number[];
    }
  | {
      type: "SET_MEDIA_TAGS";
      id: number;
      title: string;
      artist: string;
      album?: string;
      albumArtUrl?: string | null;
    }
  | {
      type: "MEDIA_TAG_REQUEST_INITIALIZED";
      id: number;
    }
  | {
      type: "MEDIA_TAG_REQUEST_FAILED";
      id: number;
    }
  | {
      type: "SET_MEDIA_DURATION";
      id: number;
      duration: number;
    }
  | {
      type: "PLAY_TRACK";
      id: number;
    }
  | {
      type: "BUFFER_TRACK";
      id: number;
    }
  | {
      type: "DRAG_SELECTED";
      offset: number;
    }
  | {
      type: "PLAY";
    }
  | {
      type: "PAUSE";
    }
  | {
      type: "SEEK_TO_PERCENT_COMPLETE";
      percent: number;
    }
  | {
      type: "MINIMIZE_WINAMP";
    }
  | {
      type: "CLOSE_REQUESTED";
      cancel: () => void;
    }
  | {
      type: "LOAD_SERIALIZED_STATE";
      serializedState: SerializedStateV1;
    }
  | { type: "RESET_WINDOW_SIZES" }
  | { type: "BROWSER_WINDOW_SIZE_CHANGED"; height: number; width: number };

export type MediaTagRequestStatus =
  | "INITIALIZED"
  | "FAILED"
  | "COMPLETE"
  | "NOT_REQUESTED";

export type MediaStatus = "PLAYING" | "STOPPED" | "PAUSED";

export type LoadStyle = "BUFFER" | "PLAY";

export type TimeMode = "ELAPSED" | "REMAINING";

interface TrackInfo {
  /**
   * Name to be used until ID3 tags can be resolved.
   *
   * If the track has a `url`, and this property is not given,
   * the filename will be used instead.
   *
   * Example: `'My Song'`
   */
  defaultName?: string;

  /**
   * Data to be used _instead_ of trying to fetch ID3 tags.
   *
   * Example: `{ artist: 'Jordan Eldredge', title: "Jordan's Song" }`
   */
  metaData?: {
    artist: string;
    title: string;
    album?: string;
    albumArtUrl?: string;
  };

  /**
   * Duration (in seconds) to be used instead of fetching enough of the file to measure its length.
   *
   * Example: 95
   */
  duration?: number;
}

export interface URLTrack extends TrackInfo {
  /**
   * Source URL of the track
   *
   * Note: This URL must be served the with correct CORs headers.
   *
   * Example: `'https://example.com/song.mp3'`
   */
  url: string;
}

export interface BlobTrack extends TrackInfo {
  /**
   * Blob source of the track
   */
  blob: Blob;
}

export interface LoadedURLTrack {
  url: string;
  metaData: {
    artist: string | null;
    title: string | null;
    album: string | null;
    albumArtUrl: string | null;
  };
}

/**
 * Many methods on the webamp instance deal with track.
 *
 * Either `url` or `blob` must be specified
 */
export type Track = URLTrack | BlobTrack;

export interface PlaylistTrack {
  id: number;
  artist?: string;
  title?: string;
  album?: string;
  url: string;
  defaultName: string | null;
  albumArtUrl?: string | null;
  selected: boolean;
  mediaTagsRequestStatus: MediaTagRequestStatus;
  duration: number | null;
}

export interface AppState {
  userInput: UserInputState;
  windows: WindowsState;
  display: DisplayState;
  settings: SettingsState;
  equalizer: EqualizerState;
  playlist: PlaylistState;
  media: MediaState;
  network: NetworkState;
}

export interface Extras {
  requireJSZip: () => Promise<never>;
  requireJSMediaTags: () => Promise<never>;
}

export type GetState = () => AppState;

export type Thunk = (
  dispatch: Dispatch,
  getState: GetState,
  extras: Extras
) => void | Promise<void>;

export type Dispatchable = Action | Thunk;

export interface DispatchObject {
  [prop: string]: (...args: any[]) => Dispatchable;
}

export type Dispatch = (action: Dispatchable) => void;

export interface MiddlewareStore {
  dispatch: Dispatch;
  getState: GetState;
}
