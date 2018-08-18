import React from "react";
import { connect } from "react-redux";
import classnames from "classnames";
import {
  CLICKED_TRACK,
  CTRL_CLICKED_TRACK,
  SHIFT_CLICKED_TRACK,
  PLAY_TRACK
} from "../../actionTypes";
import { getCurrentTrackId, getSkinPlaylistStyle } from "../../selectors";

class TrackCell extends React.Component {
  _onMouseDown = e => {
    if (e.shiftKey) {
      this.props.shiftClick(e);
      return;
    } else if (e.metaKey || e.ctrlKey) {
      this.props.ctrlClick(e);
      return;
    }

    if (!this.props.selected) {
      this.props.click(e);
    }

    this.props.handleMoveClick(e);
  };

  render() {
    const {
      skinPlaylistStyle,
      selected,
      current,
      children,
      onDoubleClick
    } = this.props;
    const style = {
      backgroundColor: selected ? skinPlaylistStyle.selectedbg : null,
      color: current ? skinPlaylistStyle.current : null
    };
    return (
      <div
        className={classnames("track-cell", { selected, current })}
        style={style}
        onClick={e => e.stopPropagation()}
        onMouseDown={this._onMouseDown}
        onContextMenu={e => e.preventDefault()}
        onDoubleClick={onDoubleClick}
      >
        {children}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {
    playlist: { tracks }
  } = state;
  const current = getCurrentTrackId(state) === ownProps.id;
  const track = tracks[ownProps.id];
  return {
    skinPlaylistStyle: getSkinPlaylistStyle(state),
    selected: track.selected,
    current
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  shiftClick: e => {
    e.preventDefault();
    return dispatch({ type: SHIFT_CLICKED_TRACK, index: ownProps.index });
  },
  ctrlClick: e => {
    e.preventDefault();
    return dispatch({ type: CTRL_CLICKED_TRACK, index: ownProps.index });
  },
  click: () => dispatch({ type: CLICKED_TRACK, index: ownProps.index }),
  onDoubleClick: () => dispatch({ type: PLAY_TRACK, id: ownProps.id })
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TrackCell);
