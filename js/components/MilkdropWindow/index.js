import React from "react";
import { connect } from "react-redux";
import screenfull from "screenfull";
import ContextMenuWrapper from "../ContextMenuWrapper";
import GenWindow from "../GenWindow";
import { WINDOWS, VISUALIZERS } from "../../constants";
import * as Selectors from "../../selectors";
import * as Actions from "../../actionCreators";
import MilkdropContextMenu from "./MilkdropContextMenu";
import Desktop from "./Desktop";

import Milkdrop from "./Milkdrop";
import Background from "./Background";

import "../../../css/milkdrop-window.css";

// This component is just responsible for loading dependencies.
// This simplifies the inner <Milkdrop /> component, by allowing
// it to always assume that it has its dependencies.
class PresetsLoader extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isFullscreen: false };
  }

  isHidden() {
    return this.props.desktop;
  }

  async componentDidMount() {
    this.props.initializePresets(this.props.options);

    screenfull.onchange(this._handleFullscreenChange);
  }

  componentWillUnmount() {
    screenfull.off("change", this._handleFullscreenChange);
  }

  _handleFullscreenChange = () => {
    this.setState({ isFullscreen: screenfull.isFullscreen });
  };

  _handleRequestFullsceen = () => {
    if (screenfull.enabled) {
      if (!screenfull.isFullscreen) {
        screenfull.request(this._wrapperNode);
      } else {
        screenfull.exit();
      }
    }
  };

  _renderMilkdrop(size) {
    const { width, height } = this.state.isFullscreen
      ? { width: screen.width, height: screen.height }
      : size;
    // Note: This _wrapperNode must not be removed from the DOM while
    // in/entering full screen mode. Ensure `this.setState({isFullscreen})`
    // does not cause this node to change identity.
    return (
      <Background innerRef={node => (this._wrapperNode = node)}>
        <Milkdrop
          {...this.props}
          width={width}
          height={height}
          isFullscreen={this.state.isFullscreen}
        />
      </Background>
    );
  }

  render() {
    if (this.props.desktop) {
      const size = { width: window.innerWidth, height: window.innerHeight };
      return (
        <ContextMenuWrapper
          onDoubleClick={this._handleRequestFullsceen}
          renderContents={() => (
            <MilkdropContextMenu
              close={this.props.closeWindow}
              toggleFullscreen={this._handleRequestFullsceen}
              desktopMode={this.props.desktop}
              toggleDesktop={this.props.toggleDesktop}
            />
          )}
        >
          <Desktop>{this._renderMilkdrop(size)}</Desktop>
        </ContextMenuWrapper>
      );
    }

    return (
      <GenWindow title={"Milkdrop"} windowId={WINDOWS.MILKDROP}>
        {({ height, width }) => (
          <ContextMenuWrapper
            onDoubleClick={this._handleRequestFullsceen}
            renderContents={() => (
              <MilkdropContextMenu
                close={this.props.closeWindow}
                toggleFullscreen={this._handleRequestFullsceen}
                desktopMode={this.props.desktop}
                toggleDesktop={this.props.toggleDesktop}
              />
            )}
          >
            {this._renderMilkdrop({ width, height })}
          </ContextMenuWrapper>
        )}
      </GenWindow>
    );
  }
}

const mapStateToProps = state => ({
  isEnabledVisualizer:
    Selectors.getVisualizerStyle(state) === VISUALIZERS.MILKDROP,
  playing: Selectors.getMediaIsPlaying(state),
  desktop: Selectors.getMilkdropDesktopEnabled(state)
});

const mapDispatchToProps = dispatch => ({
  closeWindow: () => dispatch(Actions.closeWindow(WINDOWS.MILKDROP)),
  toggleDesktop: () => dispatch(Actions.toggleMilkdropDesktop()),
  initializePresets: presets => dispatch(Actions.initializePresets(presets))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PresetsLoader);
