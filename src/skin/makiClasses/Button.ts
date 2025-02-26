import GuiObj, {UI} from "./GuiObj";
import { V } from "../../maki/v";
import AudioEventedGui from "../AudioEventedGui";
import { UIRoot } from "../../UIRoot";
import { uiRegistry, xmlRegistry } from "@lib/registry";
import { xml } from "@odoo/owl";

export class ButtonUI extends UI {
  // static template = xml`
  // <t t-name="ButtonUi" t-inherit="ui" t-inherit-mode="primary">
  //   <xpath expr="//t[@t-name='ui']" position="attributes">
  //     <attribute name="t-on-click">handleClick</attribute>
  //   </xpath>
  // </t>`
  // static template = xml`
  // <t t-tag="props.node.tag" t-att-id="props.node.getId()" t-att-class="getCssClass()" t-att-style="style()">
  //  <Children children="props.node.children" />
  // </t>`;
  // static components = {Children}

  // attrs(){
  //   let attr = super.attrs()
  //   attr['t-on-click'] = 'handleClick'
  //   return attr;
  // }
  // handleCLick(ev:MouseEvent){
  //   console.log('click!')
  // }

  // get att() {
  //   return this.props.node.attributes;
  // }

  // getCssClass(){
  //   return this.props.node? this.props.node.tag : 'unknown-tag'
  // }
  // style0() {
  //   let style = super.style();
  //   if (this.att.image) {
  //     // const url = this.env.bitmaps[this.att.image].url
  //     const bitmap = this.env.ui.bitmaps[this.att.image];
  //     const url = bitmap.url;
  //     style += `background:url(${url});`;
  //     if(this.att.w==null || this.att.h==null){
  //       if(bitmap.attributes.w==null || bitmap.attributes.h==null){
  //         const img = new Image();
  //         img.addEventListener("load", () => {
  //           this.att.w = img.width
  //           this.att.h = img.height
  //         });
  //         img.addEventListener("error", () => {
  //           console.warn(`cant load empty image: ${this.att.image}. ::`, url);
            
  //         });
  //         // img.src = `url(${url})`
  //         img.src = url
  //       }

        
  //       if (bitmap.attributes.w) style += `width:${bitmap.attributes.w}px;`;
  //       if (bitmap.attributes.h) style += `height:${bitmap.attributes.h}px;`;
  //     }
  //     if (bitmap.attributes.x)
  //       style += `background-position-x:${-bitmap.attributes.x}px;`;
  //     if (bitmap.attributes.y)
  //       style += `background-position-y:${-bitmap.attributes.y}px;`;

  //     /*
  //     titlebar.center.active
  //     left: 10px;
  //     top: 1px;
  //     width: calc(100% + -20px);
  //     background: url(blob:http://localhost:3001/3ac4cdd0-c1c5-4db1-88af-2292cc6cfdbd);
  //     height: 9px;
  //     background-position-x: -50px;
  //     background-position-y: -100px;
  //     background-size: 400px 166px;   400% x 100%
  //     */
  //   }
  //   // if (visible != null && !visible) style += `display:none;`;
  //   return style;
  // }
}

uiRegistry.add('button', ButtonUI)

// http://wiki.winamp.com/wiki/XML_GUI_Objects#.3Cbutton.2F.3E_.26_.3Ctogglebutton.2F.3E
export default class Button extends AudioEventedGui {
  static GUID = "698eddcd4fec8f1e44f9129b45ff09f9";
  _image: string;
  _downimage: string;
  _hoverimage: string;
  _activeimage: string;
  _active: boolean = false;
  _action: string | null = null;
  _param: string | null = null;
  _actionTarget: string | null = null;

  // constructor(uiRoot: UIRoot) {
  //   super(uiRoot);
  //   // TODO: Cleanup!
  //   this._div.addEventListener("mousedown", this._handleMouseDown.bind(this));
  //   this._div.addEventListener("click", (e: MouseEvent) => {
  //     if (e.button == 0) {
  //       e.stopPropagation();
  //       e.preventDefault();
  //       this.leftclick();
  //     }
  //   });
  // }

  setXmlAttr(_key: string, value: string): boolean {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "image":
        this._image = value;
        this._renderBackground();
        break;
      case "downimage":
        this._downimage = value;
        this._renderBackground();
        break;
      case "hoverimage":
        this._hoverimage = value;
        this._renderBackground();
        break;
      case "activeimage":
        this._activeimage = value;
        this._renderBackground();
        break;
      case "action":
        this._action = value;
        break;
      case "param":
        this._param = value;
        break;
      case "action_target":
      case "cbtarget":
        this._actionTarget = value;
        break;
      default:
        return false;
    }
    return true;
  }

  // This shadows `getheight()` on GuiObj
  getheight(): number {
    if (this._h) {
      return this._h;
    }
    if (this._image != null) {
      const bitmap = this._uiRoot.getBitmap(this._image);
      if (bitmap) return bitmap.getHeight();
    }
    return super.getheight();
  }

  // This shadows `getwidth()` on GuiObj
  getwidth(): number {
    if (this._w) {
      return this._w;
    }
    if (this._image != null) {
      const bitmap = this._uiRoot.getBitmap(this._image);
      if (bitmap) return bitmap.getWidth();
    }
    return super.getwidth();
  }

  getActivated(): boolean {
    return this._active ? true : false;
  }
  setActivated(onoff: boolean): void {
    onoff = Boolean(onoff); // may receive int as bool

    if (onoff !== this._active) {
      this._active = onoff;
      // this._renderActive();
    }
    //sometime maki call: setactivated(getactivated())
    // this._uiRoot.vm.dispatch(this, "onactivate", [V.newBool(onoff)]);
    this.emitter.trigger('onActivated', [V.newBool(onoff)])
  }

  setactivatednocallback(onoff: boolean) {
    if (onoff !== this._active) {
      this._active = onoff;
      this._renderActive();
    }
  }

  leftclick() {
    if (this._action) {
      this.dispatchAction(this._action, this._param, this._actionTarget);
      this.invalidateActionState();
    }
    this.onLeftClick();
  }

  onLeftClick() {
    // this._uiRoot.vm.dispatch(this, "onleftclick", []);
  }

  handleAction(
    action: string,
    param: string | null = null,
    actionTarget: string | null = null,
    source: GuiObj = null
  ): boolean {
    if (actionTarget) {
      const guiObj = this.findObject(actionTarget);
      if (guiObj) {
        guiObj.handleAction(action, param, null, this);
        return true;
      }
    }
    return false;
  }

  /**
   * when button has "action" property,
   * the "active" property should auto reflect the actual situation.
   * eg action="EQ_TOGGLE" will set button to active|not
   */
  invalidateActionState() {
    const active = this._uiRoot.getActionState(
      this._action,
      this._param,
      this._actionTarget
    );
    if (active != null) {
      this.setactivatednocallback(active);
    }
  }

  initialize() {
    super.initialize();

    if (this._action != null) {
      // listen the actual action state
      this._uiRoot.on(this._action.toLowerCase(), () =>
        this.invalidateActionState()
      );
    }
    this.invalidateActionState();
  }

  _renderActive() {
    if (this._active) {
      this._div.classList.add("active");
    } else {
      this._div.classList.remove("active");
    }
  }

  _renderBackground() {
    if (this._image != null && this._uiRoot.hasBitmap(this._image)) {
      const bitmap = this._uiRoot.getBitmap(this._image);
      this.setBackgroundImage(bitmap);
    } else {
      this.setBackgroundImage(null);
    }

    if (this._downimage != null && this._uiRoot.hasBitmap(this._downimage)) {
      const downBitmap = this._uiRoot.getBitmap(this._downimage);
      this.setDownBackgroundImage(downBitmap);
    } else {
      this.setDownBackgroundImage(null);
    }

    if (this._hoverimage != null && this._uiRoot.hasBitmap(this._hoverimage)) {
      const hoverimage = this._uiRoot.getBitmap(this._hoverimage);
      this.setHoverBackgroundImage(hoverimage);
    } else {
      this.setHoverBackgroundImage(null);
    }

    if (
      this._activeimage != null &&
      this._uiRoot.hasBitmap(this._activeimage)
    ) {
      const activeimage = this._uiRoot.getBitmap(this._activeimage);
      this.setActiveBackgroundImage(activeimage);
    } else {
      this.setActiveBackgroundImage(null);
    }
  }

  _handleMouseDown(e: MouseEvent) {
    // don't send to parent to start move/resizing
    e.stopPropagation();
    // buttonToggle will handle it
  }

  draw() {
    super.draw();
    this._div.classList.add("webamp--img");
    this._div.style.pointerEvents = "auto";
    this._renderBackground();
  }

  hide() {
    if (document.activeElement == this._div) {
      this.getparentlayout()._parent._div.focus();
    }
    super.hide();
  }

  /*
  extern Button.onActivate(int activated);
  extern Button.onLeftClick();
  extern Button.onRightClick();
  extern Button.setActivatedNoCallback(Boolean onoff);
  extern Button.leftClick();
  extern Button.rightClick();e
  */
}
xmlRegistry.add('button', Button)