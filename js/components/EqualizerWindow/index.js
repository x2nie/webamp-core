import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import classnames from "classnames";
import Volume from "../Volume";
import Balance from "../Balance";
import { segment } from "../../utils";

import { BANDS, WINDOWS } from "../../constants";
import {
  setEqBand,
  setPreamp,
  setEqToMax,
  setEqToMid,
  setEqToMin,
  closeEqualizerWindow,
  toggleEqualizerShadeMode
} from "../../actionCreators";

import { SET_FOCUSED_WINDOW } from "../../actionTypes";

import Band from "./Band";
import EqOn from "./EqOn";
import EqAuto from "./EqAuto";
import EqGraph from "./EqGraph";
import PresetsContextMenu from "./PresetsContextMenu";

import "../../../css/equalizer-window.css";

const bandClassName = band => `band-${band}`;

const EqualizerWindow = props => {
  const { doubled, selected, volume, balance, shade } = props;

  const className = classnames({
    selected,
    doubled,
    shade,
    window: true,
    draggable: true
  });

  const classes = ["left", "center", "right"];
  const eqVolumeClassName = segment(0, 100, volume, classes);
  const eqBalanceClassName = segment(-100, 100, balance, classes);
  return (
    <div
      id="equalizer-window"
      className={className}
      onMouseDown={props.focusWindow}
    >
      {props.shade ? (
        <div className="draggable">
          <div id="equalizer-shade" onClick={props.toggleEqualizerShadeMode} />
          <div id="equalizer-close" onClick={props.closeEqualizerWindow} />
          <Volume id="equalizer-volume" className={eqVolumeClassName} />
          <Balance id="equalizer-balance" className={eqBalanceClassName} />
        </div>
      ) : (
        <div>
          <div className="equalizer-top title-bar draggable">
            <div
              id="equalizer-shade"
              onClick={props.toggleEqualizerShadeMode}
            />
            <div id="equalizer-close" onClick={props.closeEqualizerWindow} />
          </div>
          <EqOn />
          <EqAuto />
          <EqGraph />
          <PresetsContextMenu fileInput={props.fileInput} />
          <Band id="preamp" band="preamp" onChange={props.setPreampValue} />
          <div id="plus12db" onClick={props.setEqToMax} />
          <div id="zerodb" onClick={props.setEqToMid} />
          <div id="minus12db" onClick={props.setEqToMin} />
          {BANDS.map(hertz => (
            <Band
              key={hertz}
              id={bandClassName(hertz)}
              band={hertz}
              onChange={props.setHertzValue(hertz)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

EqualizerWindow.propTypes = {
  doubled: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
  shade: PropTypes.bool.isRequired
};

const mapDispatchToProps = dispatch => ({
  focusWindow: () =>
    dispatch({ type: SET_FOCUSED_WINDOW, window: WINDOWS.EQUALIZER }),
  setPreampValue: value => dispatch(setPreamp(value)),
  setEqToMin: () => dispatch(setEqToMin()),
  setEqToMid: () => dispatch(setEqToMid()),
  setEqToMax: () => dispatch(setEqToMax()),
  setHertzValue: hertz => value => dispatch(setEqBand(hertz, value)),
  closeEqualizerWindow: () => dispatch(closeEqualizerWindow()),
  toggleEqualizerShadeMode: () => dispatch(toggleEqualizerShadeMode())
});

const mapStateToProps = state => ({
  doubled: state.display.doubled,
  selected: state.windows.focused === WINDOWS.EQUALIZER,
  shade: state.display.equalizerShade,
  volume: state.media.volume,
  balance: state.media.balance
});

export default connect(mapStateToProps, mapDispatchToProps)(EqualizerWindow);
