import React from "react";
import { connect } from "react-redux";
import Slider from "rc-slider/lib/Slider";
import { SET_BAND_FOCUS, UNSET_FOCUS } from "../../actionTypes";

const MAX_VALUE = 100;
// Given a value between 1-100, return the sprite number (0-27)
export const spriteNumber = value => {
  const percent = value / 100;
  return Math.round(percent * 27);
};

// Given a sprite number, return the x,y
export const spriteOffsets = number => {
  const x = number % 14;
  const y = Math.floor(number / 14);
  return { x, y };
};

const Handle = () => <div className="rc-slider-handle" />;

const Band = ({
  value,
  backgroundPosition,
  id,
  onChange,
  handleMouseDown,
  handleMouseUp
}) => (
  <div id={id} className="band" style={{ backgroundPosition }}>
    <Slider
      type="range"
      min={0}
      max={MAX_VALUE}
      step={1}
      value={MAX_VALUE - value}
      vertical
      onChange={onChange}
      onBeforeChange={handleMouseDown}
      onAfterChange={handleMouseUp}
      handle={Handle}
    />
  </div>
);

const mapStateToProps = (state, ownProps) => {
  const value = state.equalizer.sliders[ownProps.band];
  const { x, y } = spriteOffsets(spriteNumber(value));
  const xOffset = x * 15; // Each sprite is 15px wide
  const yOffset = y * 65; // Each sprite is 15px tall
  const backgroundPosition = `-${xOffset}px -${yOffset}px`;
  return {
    id: ownProps.id,
    value,
    backgroundPosition
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  handleMouseDown: () =>
    dispatch({ type: SET_BAND_FOCUS, input: "eq", bandFocused: ownProps.band }),
  handleMouseUp: () => dispatch({ type: UNSET_FOCUS })
});

export default connect(mapStateToProps, mapDispatchToProps)(Band);
