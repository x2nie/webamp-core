import React from "react";
import { connect } from "react-redux";
import {
  close,
  openMediaFileDialog,
  loadMediaFiles,
  toggleWindow
} from "../../actionCreators";
import { getGenWindows } from "../../selectors";
import { LOAD_STYLE } from "../../constants";
import { Hr, Node, Parent, LinkNode } from "../ContextMenu";
import PlaybackContextMenu from "../PlaybackContextMenu";
import SkinsContextMenu from "../SkinsContextMenu";

const MainContextMenu = props => (
  <React.Fragment>
    <LinkNode
      href="https://github.com/captbaritone/webamp"
      target="_blank"
      label="Webamp..."
    />
    <Hr />
    <Parent label="Play">
      <Node onClick={props.openMediaFileDialog} label="File..." hotkey="L" />
      {props.filePickers &&
        props.filePickers.map(
          (picker, i) =>
            (props.networkConnected || !picker.requiresNetwork) && (
              <Node
                key={i}
                onClick={async () => {
                  let files;
                  try {
                    files = await picker.filePicker();
                  } catch (e) {
                    console.error("Error loading from file picker", e);
                  }
                  props.loadMediaFiles(files, LOAD_STYLE.PLAY);
                }}
                label={picker.contextMenuName}
              />
            )
        )}
    </Parent>
    <Hr />
    {Object.keys(props.genWindows).map(i => (
      <Node
        key={i}
        label={props.genWindows[i].title}
        checked={props.genWindows[i].open}
        onClick={() => props.toggleGenWindow(i)}
        hotKey={() => props.genWindows[i].hotkey}
      />
    ))}
    <Hr />
    <SkinsContextMenu />
    <Hr />
    <Parent label="Playback">
      <PlaybackContextMenu />
    </Parent>
    <Hr />
    <Node onClick={props.close} label="Exit" />
  </React.Fragment>
);

const mapStateToProps = state => ({
  networkConnected: state.network.connected,
  genWindows: getGenWindows(state)
});

const mapDispatchToProps = {
  close,
  openMediaFileDialog,
  loadMediaFiles,
  toggleGenWindow: toggleWindow
};

export default connect(mapStateToProps, mapDispatchToProps)(MainContextMenu);
