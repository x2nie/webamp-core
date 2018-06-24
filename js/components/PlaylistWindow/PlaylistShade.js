import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import {
  getOrderedTracks,
  getMinimalMediaText,
  getWindowSize
} from "../../selectors";
import { getTimeStr } from "../../utils";
import { SET_FOCUSED_WINDOW } from "../../actionTypes";

import {
  WINDOWS,
  WINDOW_RESIZE_SEGMENT_WIDTH,
  WINDOW_WIDTH,
  CHARACTER_WIDTH,
  UTF8_ELLIPSIS
} from "../../constants";
import { togglePlaylistShadeMode, closeWindow } from "../../actionCreators";
import CharacterString from "../CharacterString";
import PlaylistResizeTarget from "./PlaylistResizeTarget";

class PlaylistShade extends React.Component {
  _addedWidth() {
    return this.props.playlistSize[0] * WINDOW_RESIZE_SEGMENT_WIDTH;
  }

  _trimmedName() {
    const { name } = this.props;
    if (name == null) {
      return "[No file]";
    }

    const MIN_NAME_WIDTH = 205;

    const nameLength = (MIN_NAME_WIDTH + this._addedWidth()) / CHARACTER_WIDTH;
    return name.length > nameLength
      ? name.slice(0, nameLength - 1) + UTF8_ELLIPSIS
      : name;
  }

  _time() {
    const { length, name } = this.props;
    return name == null ? "" : getTimeStr(length);
  }

  render() {
    const { toggleShade, close, focusPlaylist, focused } = this.props;

    const style = {
      width: `${WINDOW_WIDTH + this._addedWidth()}px`
    };

    const classes = classnames("window", "draggable", {
      selected: focused === WINDOWS.PLAYLIST
    });

    return (
      <div
        id="playlist-window-shade"
        className={classes}
        style={{ width: style.width }}
        onMouseDown={focusPlaylist}
        onDoubleClick={toggleShade}
      >
        <div className="left">
          <div className="right draggable">
            <div id="playlist-shade-track-title">
              <CharacterString>{this._trimmedName()}</CharacterString>
            </div>
            <div id="playlist-shade-time">
              <CharacterString>{this._time()}</CharacterString>
            </div>
            <PlaylistResizeTarget widthOnly />
            <div id="playlist-shade-button" onClick={toggleShade} />
            <div id="playlist-close-button" onClick={close} />
          </div>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = {
  focusPlaylist: () => ({ type: SET_FOCUSED_WINDOW, window: WINDOWS.PLAYLIST }),
  close: () => closeWindow("playlist"),
  toggleShade: () => togglePlaylistShadeMode()
};

const mapStateToProps = state => {
  const {
    windows: { focused },
    media: { length }
  } = state;
  return {
    focused,
    playlistSize: getWindowSize(state, "playlist"),
    trackOrder: getOrderedTracks(state),
    length,
    name: getMinimalMediaText(state)
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PlaylistShade);
