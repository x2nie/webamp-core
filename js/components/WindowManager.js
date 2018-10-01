import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  snapDiffManyToMany,
  boundingBox,
  snapWithinDiff,
  snap,
  traceConnection,
  applyDiff,
  applyMultipleDiffs
} from "../snapUtils";
import {
  getWindowsInfo,
  getWindowHidden,
  getWindowOpen,
  getCenterRequested
} from "../selectors";
import {
  updateWindowPositions,
  windowsHaveBeenCentered
} from "../actionCreators";
import { WINDOW_HEIGHT, WINDOW_WIDTH } from "../constants";
import { calculateBoundingBox } from "../utils";

const abuts = (a, b) => {
  // TODO: This is kinda a hack. They should really be touching, not just within snapping distance.
  // Also, overlapping should not count.
  const wouldMoveTo = snap(a, b);
  return wouldMoveTo.x !== undefined || wouldMoveTo.y !== undefined;
};

class WindowManager extends React.Component {
  componentDidMount() {
    this.centerWindowsIfNeeded();
  }

  centerWindowsIfNeeded = () => {
    const { container, centerRequested } = this.props;
    if (!centerRequested) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const offsetLeft = rect.left + window.scrollX;
    const offsetTop = rect.top + window.scrollY;
    const width = container.scrollWidth;
    const height = container.scrollHeight;

    if (this.props.windowsInfo.some(w => w.x == null || w.y == null)) {
      // Some windows do not have an initial position, so we'll come up
      // with your own layout.
      const windowPositions = {};
      const keys = this.windowKeys();
      const totalHeight = keys.length * WINDOW_HEIGHT;
      const globalOffsetLeft = Math.max(0, width / 2 - WINDOW_WIDTH / 2);
      const globalOffsetTop = Math.max(0, height / 2 - totalHeight / 2);
      keys.forEach((key, i) => {
        const offset = WINDOW_HEIGHT * i;
        windowPositions[key] = {
          x: Math.ceil(offsetLeft + globalOffsetLeft),
          y: Math.ceil(offsetTop + (globalOffsetTop + offset))
        };
      });
      this.props.updateWindowPositions(windowPositions, false);
    } else {
      // A layout has been suplied. We will compute the bounding box and
      // center the given layout.
      const bounding = calculateBoundingBox(
        this.props.windowsInfo.filter(w => this.props.getWindowOpen(w.key))
      );

      const boxHeight = bounding.bottom - bounding.top;
      const boxWidth = bounding.right - bounding.left;

      const move = {
        x: Math.ceil(offsetLeft - bounding.left + (width - boxWidth) / 2),
        y: Math.ceil(offsetTop - bounding.top + (height - boxHeight) / 2)
      };

      const newPositions = this.props.windowsInfo.reduce(
        (pos, w) => ({
          ...pos,
          [w.key]: { x: move.x + w.x, y: move.y + w.y }
        }),
        {}
      );

      this.props.updateWindowPositions(newPositions, false);
    }
    this.props.windowsHaveBeenCentered();
  };

  movingAndStationaryNodes(key) {
    const windows = this.props.windowsInfo.filter(
      w =>
        this.props.windows[w.key] != null && !this.props.getWindowHidden(w.key)
    );
    const targetNode = windows.find(node => node.key === key);

    let movingSet = new Set([targetNode]);
    // Only the main window brings other windows along.
    if (key === "main") {
      const findAllConnected = traceConnection(abuts);
      movingSet = findAllConnected(windows, targetNode);
    }

    const stationary = windows.filter(w => !movingSet.has(w));
    const moving = Array.from(movingSet);

    return [moving, stationary];
  }

  handleMouseDown = (key, e) => {
    if (!e.target.classList.contains("draggable")) {
      return;
    }
    // Prevent dragging from highlighting text.
    e.preventDefault();

    const [moving, stationary] = this.movingAndStationaryNodes(key);

    const mouseStart = { x: e.clientX, y: e.clientY };
    // Aparently this is crazy across browsers.
    const browserSize = {
      width: Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.body.clientWidth,
        document.documentElement.clientWidth
      ),
      height: Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      )
    };

    const box = boundingBox(moving);

    const handleMouseMove = ee => {
      const proposedDiff = {
        x: ee.clientX - mouseStart.x,
        y: ee.clientY - mouseStart.y
      };

      const proposedWindows = moving.map(node => ({
        ...node,
        ...applyDiff(node, proposedDiff)
      }));

      const proposedBox = {
        ...box,
        ...applyDiff(box, proposedDiff)
      };

      const snapDiff = snapDiffManyToMany(proposedWindows, stationary);

      const withinDiff = snapWithinDiff(proposedBox, browserSize);

      const finalDiff = applyMultipleDiffs(proposedDiff, snapDiff, withinDiff);

      const windowPositionDiff = moving.reduce((diff, window) => {
        diff[window.key] = applyDiff(window, finalDiff);
        return diff;
      }, {});

      this.props.updateWindowPositions(windowPositionDiff, false);
    };

    const removeListeners = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", removeListeners);
    };

    window.addEventListener("mouseup", removeListeners);
    window.addEventListener("mousemove", handleMouseMove);
  };

  // Keys for the visible windows
  windowKeys() {
    // TODO: Iterables can probably do this better.
    return Object.keys(this.props.windows).filter(
      key => !!this.props.windows[key]
    );
  }

  render() {
    const style = {
      position: "absolute",
      top: 0,
      left: 0
    };

    const windows = this.props.windowsInfo.filter(
      w => this.props.windows[w.key]
    );

    return windows.map(w => (
      <div
        key={w.key}
        onMouseDown={e => this.handleMouseDown(w.key, e)}
        style={{ ...style, transform: `translate(${w.x}px, ${w.y}px)` }}
      >
        {this.props.windows[w.key]}
      </div>
    ));
  }
}

WindowManager.propTypes = {
  windows: PropTypes.object.isRequired,
  container: PropTypes.instanceOf(Element).isRequired
};

const mapStateToProps = state => ({
  windowsInfo: getWindowsInfo(state),
  getWindowHidden: getWindowHidden(state),
  getWindowOpen: getWindowOpen(state),
  centerRequested: getCenterRequested(state)
});

const mapDispatchToProps = dispatch => {
  return {
    updateWindowPositions: (positions, centered) =>
      dispatch(updateWindowPositions(positions, centered)),
    windowsHaveBeenCentered: () => dispatch(windowsHaveBeenCentered())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WindowManager);
