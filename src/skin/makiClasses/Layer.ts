import GuiObj from "./GuiObj";
import Movable from "./Movable";
import { Edges } from "../Clippath";
import { uiRegistry, xmlRegistry } from "@lib/registry";
import { GroupUI } from "./Group";
import { UI } from "../Children";
import { ButtonUI } from "./Button";
import { onWillStart } from "@odoo/owl";

export class LayerUI extends UI {
  setup(): void {
    super.setup()
    onWillStart(()=>{
      if(this.att.sysregion && !this.att.clippath){
        // debugger
        const bitmap = this.env.ui.bitmaps[this.att.image];
        const image = this.node.root._image[bitmap.attributes.file].img
        const canvas = document.createElement('canvas');
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext("2d")
        ctx.drawImage(image,0,0)
        // if (this._sysregion == 1 && this._image) {
          // const bitmap = this._uiRoot.getBitmap(this._image);
          // if (bitmap && bitmap.getImg()) {
            // const canvas = bitmap.getCanvas();
            const edge = new Edges();
            edge.parseCanvasTransparency(canvas, image.width, image.height);
            if (!edge.isSimpleRect()) {
              this.att.clippath = edge.getPolygon();
              // return;
            }
          // }
          // if anything failed, don't repeat:
          // this.setXmlAttr("sysregion", "0");
      }
    })
  }

  style(): string {
    let style = super.style();
    const {clippath} = this.att;
    if(clippath==1 || clippath==-2 ) style += `clip-path: ${clippath};`
    return style;
  }
}
uiRegistry.add('layer', LayerUI)

// http://wiki.winamp.com/wiki/XML_GUI_Objects#.3Clayer.2F.3E
export default class Layer extends Movable {
  static GUID = "5ab9fa1545579a7d5765c8aba97cc6a6";
  _image: string;
  _inactiveImage: string;

  setXmlAttr(key: string, value: string): boolean {
    if (super.setXmlAttr(key, value)) {
      if (key == "sysregion") {
        this._renderRegion();
      }
      return true;
    }
    switch (key) {
      case "image":
        this._image = value;
        this._renderBackground();
        this._renderRegion();
        break;
      case "inactiveimage":
        this._inactiveImage = value;
        this._renderBackground();
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

  _renderBackground() {
    const bitmap =
      this._image != null ? this._uiRoot.getBitmap(this._image) : null;
    this.setBackgroundImage(bitmap);
    this.setInactiveBackgroundImage(bitmap);
    if (this._inactiveImage) {
      this.setInactiveBackgroundImage(
        this._uiRoot.getBitmap(this._inactiveImage)
      );
      this._div.classList.add("inactivable");
    }
  }

  _renderRegion() {
    if (this._sysregion == 1 && this._image) {
      const bitmap = this._uiRoot.getBitmap(this._image);
      if (bitmap && bitmap.getImg()) {
        const canvas = bitmap.getCanvas();
        const edge = new Edges();
        edge.parseCanvasTransparency(canvas, this.getwidth(), this.getheight());
        if (!edge.isSimpleRect()) {
          this._div.style.clipPath = edge.getPolygon();
          return;
        }
      }
      // if anything failed, don't repeat:
      this.setXmlAttr("sysregion", "0");
    }
  }

  draw() {
    super.draw();
    this._div.classList.add("webamp--img");
    this._renderBackground();
  }
}
xmlRegistry.add('layer', Layer)