import UI_ROOT from "../../UIRoot";
import { assume, clamp, num, px } from "../../utils";
import GuiObj from "./GuiObj";

interface ActionHandler {
  // 0-255
  onsetposition(position: number): void;
  dispose(): void;
}
const MAX = 255;

// http://wiki.winamp.com/wiki/XML_GUI_Objects#.3Cslider.2F.3E_.26_.3CWasabi:HSlider.2F.3E_.26_.3CWasabi:VSlider.2F.3E
export default class Slider extends GuiObj {
  static GUID = "62b65e3f408d375e8176ea8d771bb94a";
  _barLeft: string;
  _barMiddle: string;
  _barRight: string;
  _vertical: boolean = false;
  _thumb: string;
  _downThumb: string;
  _hoverThumb: string;
  _action: string | null = null;
  _low: number;
  _high: number;
  _position: number = 0;
  _param: string | null = null;
  _thumbDiv: HTMLDivElement = document.createElement("div");
  _actionHandler: null | ActionHandler;

  constructor() {
    super();
    this._thumbDiv.addEventListener("mousedown", (downEvent: MouseEvent) => {
      const bitmap = UI_ROOT.getBitmap(this._thumb);
      const startX = downEvent.clientX;
      const startY = downEvent.clientY;
      const width = this.getwidth() - bitmap.getWidth();
      const height = this.getheight() - bitmap.getHeight();
      const initialPostition = this._position;

      const handleMove = (moveEvent: MouseEvent) => {
        const newMouseX = moveEvent.clientX;
        const newMouseY = moveEvent.clientY;
        const deltaY = newMouseY - startY;
        const deltaX = newMouseX - startX;

        const deltaPercent = this._vertical ? deltaY / height : deltaX / width;
        const newPercent = this._vertical
          ? initialPostition - deltaPercent
          : initialPostition + deltaPercent;

        this._position = clamp(newPercent, 0, 1);
        this._renderThumbPosition();
        this.onsetposition(this.getposition());
      };

      const handleMouseUp = () => {
        UI_ROOT.vm.dispatch(this, "onsetfinalposition", [
          { type: "INT", value: this.getposition() },
        ]);
        UI_ROOT.vm.dispatch(this, "onpostedposition", [
          { type: "INT", value: this.getposition() },
        ]);
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleMouseUp);
    });
  }
  setXmlAttr(key: string, value: string): boolean {
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "thumb":
        // (id) The bitmap element for the slider thumb.
        this._thumb = value;
        break;
      case "downthumb":
        // (id) The bitmap element for the slider thumb when held by the user.
        this._downThumb = value;
        break;
      case "hoverthumb":
        // (id) The bitmap element for the slider thumb when the user's mouse is above it.
        this._hoverThumb = value;
        break;
      case "barmiddle":
        // (id) The bitmap element for the middle, stretched, position of the slider.
        this._barMiddle = value;
        break;
      case "barleft":
        // (id) The bitmap element for the left or top position of the slider.
        this._barLeft = value;
        break;
      case "barright":
        // (id) The bitmap element for the right or bottom position of the slider.
        this._barRight = value;
        break;
      case "orientation":
        // (str) Either "v" or "vertical" to make the slider vertical, otherwise it will be horizontal.
        const lower = value.toLowerCase();
        this._vertical = lower === "v" || lower === "vertical";
        break;
      case "low":
        // (int) Set the low-value boundary. Default is 0.
        this._low = num(value);
        break;
      case "high":
        // (int) Set the high-value boundary. Default is 255.
        this._high = num(value);
        break;
      case "action":
        this._setAction(value);
        break;
      case "param":
        // Undocumented? In MMD3 for EQ (eq_band) action, this seems to indicate _which_ band.
        this._param = value;
        break;
      default:
        return false;
    }
    return true;
  }

  init() {
    this._initializeActionHandler();
  }

  _initializeActionHandler() {
    switch (this._action) {
      case "seek":
        this._actionHandler = new SeekActionHandler(this);
        break;
      case "eq_band":
        this._actionHandler = new EqActionHandler(this, this._param);
        break;
      case "pan":
        this._actionHandler = new PanActionHandler(this);
        break;
      case "volume":
        this._actionHandler = new VolumeActionHandler(this);
        break;
      case null:
        break;
      default:
        assume(false, `Unhandled slider action: ${this._action}`);
    }
  }

  _setAction(value: string) {
    if (this._actionHandler != null) {
      this._actionHandler.dispose();
      this._actionHandler = null;
    }
    this._action = value.toLowerCase();

    // If we've already initialized we might have an action handler already. In
    // that case, we want to reinitialize.
    if (this._actionHandler != null) {
      this._actionHandler.dispose();
      this._initializeActionHandler();
    }
  }

  // extern Int Slider.getPosition();
  getposition(): number {
    return this._position * MAX;
  }

  onsetposition(newPos: number) {
    UI_ROOT.vm.dispatch(this, "onsetposition", [
      { type: "INT", value: newPos },
    ]);
    if (this._actionHandler != null) {
      this._actionHandler.onsetposition(newPos);
    }
  }

  _renderThumb() {
    this._thumbDiv.style.position = "absolute";
    this._thumbDiv.setAttribute("data-obj-name", "Slider::Handle");
    this._thumbDiv.classList.add("webamp--img");
    if (this._thumb != null) {
      const bitmap = UI_ROOT.getBitmap(this._thumb);
      this._thumbDiv.style.width = px(bitmap.getWidth());
      this._thumbDiv.style.height = px(bitmap.getHeight());
      bitmap.setAsBackground(this._thumbDiv);
    }

    if (this._downThumb != null) {
      const bitmap = UI_ROOT.getBitmap(this._downThumb);
      bitmap.setAsActiveBackground(this._thumbDiv);
    }

    if (this._hoverThumb != null) {
      const bitmap = UI_ROOT.getBitmap(this._hoverThumb);
      bitmap.setAsHoverBackground(this._thumbDiv);
    }
  }

  _renderThumbPosition() {
    if (this._thumb != null) {
      const bitmap = UI_ROOT.getBitmap(this._thumb);
      // TODO: What if the orientation has changed?
      if (this._vertical) {
        const top =
          (1 - this._position) * (this.getheight() - bitmap.getHeight());
        this._thumbDiv.style.top = px(top);
      } else {
        const left = this._position * (this.getwidth() - bitmap.getWidth());
        this._thumbDiv.style.left = px(left);
      }
    }
  }

  draw() {
    super.draw();
    this._div.setAttribute("data-obj-name", "Slider");
    assume(this._barLeft == null, "Need to handle Slider barleft");
    assume(this._barRight == null, "Need to handle Slider barright");
    assume(this._barMiddle == null, "Need to handle Slider barmiddle");
    this._renderThumb();
    this._renderThumbPosition();
    this._div.appendChild(this._thumbDiv);
  }

  dispose() {
    if (this._actionHandler) {
      this._actionHandler.dispose();
    }
    super.dispose();
  }

  /*
  extern Slider.onPostedPosition(int newpos);
  extern Slider.onSetFinalPosition(int pos);
  extern Slider.setPosition(int pos);
  extern Slider.lock(); // locks descendant core collbacks
  extern Slider.unlock(); // unloads the
  */
}

/*****
 * Here we have the action handlers for the different action types:
 * Each one takes a reference to the slider and adds some extra behavior.
 * It's a bit odd that they access pirvate fields/methods, but since they live
 * in the same file I've allowed myself the sin of doing that.
 **/

// eslint-disable-next-line rulesdir/proper-maki-types
class SeekActionHandler implements ActionHandler {
  _subscription: () => void;
  constructor(slider: Slider) {
    const update = () => {
      slider._position = UI_ROOT.audio.getCurrentTimePercent();
      // TODO: We could throttle this, or only render if the change is "significant"?
      slider._renderThumbPosition();
    };
    update();
    this._subscription = UI_ROOT.audio.onCurrentTimeChange(update);
  }

  onsetposition(position: number): void {
    UI_ROOT.audio.seekToPercent(position / MAX);
  }
  dispose(): void {
    this._subscription();
  }
}

// eslint-disable-next-line rulesdir/proper-maki-types
class EqActionHandler implements ActionHandler {
  _subscription: () => void;
  _kind: string;
  constructor(slider: Slider, kind: string) {
    this._kind = kind;
    const update = () => {
      slider._position = UI_ROOT.audio.getEq(kind);
      slider._renderThumbPosition();
    };
    update();
    this._subscription = UI_ROOT.audio.onEqChange(kind, update);
  }

  onsetposition(position: number): void {
    UI_ROOT.audio.setEq(this._kind, position / MAX);
  }
  dispose(): void {
    this._subscription();
  }
}

// eslint-disable-next-line rulesdir/proper-maki-types
class PanActionHandler implements ActionHandler {
  _subscription: () => void;
  constructor(slider: Slider) {
    this._subscription = () => {};
  }

  onsetposition(position: number): void {
    // TODO
  }
  dispose(): void {
    this._subscription();
  }
}

// eslint-disable-next-line rulesdir/proper-maki-types
class VolumeActionHandler implements ActionHandler {
  _subscription: () => void;
  constructor(slider: Slider) {
    this._subscription = () => {};
  }

  onsetposition(position: number): void {
    // TODO
  }
  dispose(): void {
    this._subscription();
  }
}
