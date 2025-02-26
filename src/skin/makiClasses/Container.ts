import { UIRoot } from "../../UIRoot";
import { assert, num, px, removeAllChildNodes, toBool } from "../../utils";
import Layout, { LayoutGui } from "./Layout";
import XmlObj from "../XmlObj";
import Group from "./Group";
import { Component, useSubEnv, xml } from "@odoo/owl";
import { uiRegistry, xmlRegistry } from "@lib/registry";
// import Children, { UI } from "../Children";
import { useWindowService, WindowManager } from "@lib/windowManager/hook";
import { UI } from "./GuiObj";

export class ContainerUI extends UI {
  // static template = xml`<div class="container" t-out="props.node.id" />`;
  static template = xml`
    <container t-att-id="att.id" t-name="Container" 
    t-att-class="{container: true, invisible: !att.visible}" 
    t-att-style="style()" 
    t-ref="root" t-on-mousedown="inMouseDown">
      <LayoutGui active="true" node="props.node.getCurLayout()"/>
    </container>
      `
  static template0 = `
    <container t-att-id="att.id" t-name="Container" 
    t-att-class="{container: true, invisible: !att.visible}" 
    t-att-style="style()" 
    t-ref="root" t-on-mousedown="inMouseDown">
      <t t-foreach="props.node.children" t-as="l" t-key="l.attributes.id">
      <LayoutGui active="l.attributes.id == att.layout_id" node="l"/>
      </t>
    </container>`;
      // t-on-dblclick="toggleLayout" 
  static components = {LayoutGui}
  static nextZIndex = 1;
  windowManager: WindowManager

  // zIndex = 1;

  setup(){
    super.setup()
    this.att.zIndex = ContainerUI.nextZIndex++;
    this.windowManager = useWindowService()
    useSubEnv({container: this})
  }
  
  style() {
    let style = super.style();
    style += `z-index:${this.att.zIndex};`
    return style
  }
  
  inMouseDown(ev){
    this.att.zIndex = ContainerUI.nextZIndex++;
    this.windowManager.handleMouseDown(this.att.id, ev)
  }
  // static template = xml`<t t-call="{{ node_template() }}" />`
  // <t t-call="{{ kanban_template }}"  />

  // node_template(){
    // debugger
    // return this.props.node.constructor.template;
    // return this.props.node.template;
  // }
}
uiRegistry.add('container', ContainerUI)

// > A container is a top level object and it basically represents a window.
// > Nothing holds a container. It is an object that holds multiple related
// > layouts. Each layout represents an appearance for that window. You can design
// > different layouts for each window but only one can be visible at a time.
//
// -- http://wiki.winamp.com/wiki/Modern_Skin:_Container
export default class Container extends XmlObj {
  static GUID = "e90dc47b4ae7840d0b042cb0fcf775d2";
  // static template = xml`<span class="container" t-out="attributes.id" />`;
  // static template = xml`<span class="container" t-out="'hello!'" />`;
  // static template = xml`<span class="container" t-out="'hello!'" />`;

  _uiRoot: UIRoot;
  _layouts: Layout[] = [];
  _activeLayout: Layout | null = null;
  _visible: boolean = true;
  _dynamic: boolean = false;
  _id: string;
  _originalId: string; // non lowercase'd
  _name: string;
  _x: number = 0;
  _y: number = 0;
  _componentGuid: string; // eg. "guid:{1234-...-0ABC}"
  _componentAlias: string; // eg. "guid:pl"
  _div: HTMLElement = document.createElement("container");

  // constructor(uiRoot: UIRoot) {
  //   super();
  //   this._uiRoot = uiRoot;
  // }


  setXmlAttr(_key: string, value: string): boolean {
    const key = _key.toLowerCase();
    if (super.setXmlAttr(key, value)) {
      return true;
    }
    switch (key) {
      case "name":
        // this._name = value;
        this.setname(value);
        break;
      case "id":
        this._originalId = value;
        this._id = value.toLowerCase();
        break;
      case "dynamic":
        this._dynamic = toBool(value);
        break;
      case "component":
        this._componentGuid = value.toLowerCase().split(":")[1];
        this.resolveAlias();
        break;
      case "default_visible":
        // allow @HAVE_LIBRARY@ (for now, its recognized as "false")
        this._visible = value == "1";
        break;
      case "x":
      case "default_x":
        this._x = num(value) ?? 0;
        this._renderDimensions();
        break;
      case "y":
      case "default_y":
        this._y = num(value) ?? 0;
        this._renderDimensions();
        break;
      default:
        return false;
    }
    return true;
  }

  initialize() {
    for (const layout of this._layouts) {
      layout.initialize();
    }
    for (const layout of this._layouts) {
      layout.afterInited();
    }
    // maki need 'onswitchtolayout':
    // this.switchtolayout(this.getcurlayout().getId())
    this._uiRoot.vm.dispatch(this, "onswitchtolayout", [
      { type: "OBJECT", value: this.getCurLayout() },
    ]);
  }

  dispose() {
    for (const layout of this._layouts) {
      layout.dispose();
    }
  }

  setname(name: string) {
    this._name = name;
  }
  getname(): string {
    return this._name;
  }
  getguid(): string {
    return this._componentGuid;
  }

  resolveAlias() {
    // const knownContainerGuids = {
    //   "{0000000a-000c-0010-ff7b-01014263450c}": "vis", // AVS {visualization}
    //   "{45f3f7c1-a6f3-4ee6-a15e-125e92fc3f8d}": "pl", // playlist editor
    //   "{6b0edf80-c9a5-11d3-9f26-00c04f39ffc6}": "ml", // media library
    //   "{7383a6fb-1d01-413b-a99a-7e6f655f4591}": "con", // config?
    //   "{7a8b2d76-9531-43b9-91a1-ac455a7c8242}": "lir", // lyric?
    //   "{a3ef47bd-39eb-435a-9fb3-a5d87f6f17a5}": "dl", // download??
    //   "{f0816d7b-fffc-4343-80f2-e8199aa15cc3}": "video", // independent video window
    // };
    const guid = this._componentGuid;
    // this._componentAlias = knownContainerGuids[guid];
    this._componentAlias = this._uiRoot.guid2alias(guid);
    if (this._componentGuid && !this._componentAlias) {
      console.warn(
        `unknown component alias for guid:${this._componentGuid}`,
        `for id:${this.getId()}`
      );
    }
  }

  /**
   * Container sometime identified with a guid, or a-guid alias
   * so which one correct (id, 'guid:{abcde}, 'guid:pl') is acceptable.
   */
  hasId(id: string): boolean {
    if (!id) return false;
    id = id.toLowerCase();
    const useGuid = id.startsWith("guid:");
    if (useGuid) {
      id = id.substring(5);
      return this._componentGuid == id || this._componentAlias == id;
    } else {
      return this._id == id;
    }
  }
  getId() {
    return this._id;
  }
  getOriginalId(): string {
    return this._originalId;
  }

  getDiv(): HTMLElement {
    return this._div;
  }

  getWidth(): number {
    return this._activeLayout.getwidth();
  }
  getHeight(): number {
    return this._activeLayout.getheight();
  }

  setWidth(w: number) {
    this._activeLayout.setXmlAttr("w", String(w));
  }
  setHeight(h: number) {
    this._activeLayout.setXmlAttr("h", String(h));
  }

  gettop(): number {
    return this._y;
  }

  getleft(): number {
    return this._x;
  }

  center() {
    const height = document.documentElement.clientHeight;
    const width = document.documentElement.clientWidth;
    this._div.style.top = px((height - this.getHeight()) / 2);
    this._div.style.left = px((width - this.getWidth()) / 2);
  }

  setLocation(x: number, y: number) {
    if (x == this._x && y == this._y) {
      return;
    }
    this._x = x;
    this._y = y;
    this._renderDimensions();
  }

  show() {
    if (!this._activeLayout) {
      this.switchToLayout(this._layouts[0]._id);
    }
    this._visible = true;
    this._renderLayout();
  }
  hide() {
    this._visible = false;
    this._renderLayout();
  }
  toggle() {
    if (!this._visible) this.show();
    else this.hide();
  }
  close() {
    this._activeLayout = null;
    this.hide();
  }
  getVisible(): boolean {
    return this._visible;
  }

  /* Required for Maki */
  /**
   * Get the layout associated with the an id.
   * This corresponds to the "id=..." attribute in
   * the XML tag <layout .. />.
   *
   *  @ret             The layout associated with the id.
   * @param  layout_id   The id of the layout you wish to retrieve.
   */
  getLayout(layoutId: string): Layout {
    const layouts = this.children.filter(c => c.tag=='layout' && c.id == layoutId.toLowerCase())
    if(layouts.length==1){
      return layouts[0] as Layout
    }
    // const lower = layoutId.toLowerCase();
    // for (const layout of this.children as Layout[]) {
    //   if (layout.tag == 'layout' && layout.getId() === lower) {
    //     return layout;
    //   }
    // }
    throw new Error(`Could not find a container with the id; "${layoutId}"`);
  }

  /**
   isDynamic()

  Tells you if the current container is a dynamic 
  container or not. Values are true (1) for dynamic
  false (0) for static.
  Dynamic Container can has multiple instance at one time.

  @ret The container type (dynamic or static).
  */
  isdynamic(): number {
    return this._dynamic ? 1 : 0;
  }

  /**
   * @ret Layout
   */
  getCurLayout(): Layout {
    return this._activeLayout;
  }

  addLayout(layout: Layout) {
    layout.setParent(this as unknown as Group);
    this._layouts.push(layout);
    if (this._activeLayout == null) {
      this._activeLayout = layout;
    }
  }

  getnumlayouts(): number {
    return this._layouts.length;
  }

  enumlayout(num: number): Layout {
    return this._layouts[num];
  }

  // parser need it.
  addChild(layout: Layout) {
    this.addLayout(layout);
  }

  _clearCurrentLayout() {
    removeAllChildNodes(this._div);
    // this._div.removeChild(this._activeLayout.getDiv())
  }

  switchToLayout(layout_id: string) {
    const layout = this.getLayout(layout_id);
    assert(layout != null, `Could not find layout with id "${layout_id}".`);
    // this._uiRoot.vm.dispatch(this, "onswitchtolayout", [
    //   { type: "OBJECT", value: layout },
    // ]);
    // this._clearCurrentLayout();
    this._activeLayout = layout;
    // this._renderLayout();
  }

  dispatchAction(
    action: string,
    param: string | null,
    actionTarget: string | null
  ) {
    switch (action) {
      case "SWITCH":
        this.switchToLayout(param);
        break;
      default:
        this._uiRoot.dispatch(action, param, actionTarget);
    }
  }

  _renderDimensions() {
    this._div.style.left = px(this._x);
    this._div.style.top = px(this._y);
  }

  _renderLayout() {
    if (this._visible && this._activeLayout) {
      // this._activeLayout.draw();
      this._div.appendChild(this._activeLayout.getDiv());
      // this.center();
    } else {
      this._clearCurrentLayout();
    }
  }

  _renderLayouts() {
    for (const layout of this._layouts) {
      layout.draw();
    }
  }

  draw() {
    this.getId() && this._div.setAttribute("id", this.getId());
    this._div.setAttribute("tabindex", "1");
    this._renderDimensions();
    this._renderLayouts();
    this._renderLayout();
  }
}

xmlRegistry.add('container', Container)