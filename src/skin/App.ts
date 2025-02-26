import { XmlElement } from "@lib/xml";
import { Component, toRaw, useEnv, useState, useSubEnv, xml } from "@odoo/owl";
import { createSkinEngineFor } from "./SkinEngine";
import { ContainerUI } from "./makiClasses/Container";
// import Children from "./Children";
import { createWindowService } from "@lib/windowManager/hook";
import { SystemUI } from "./makiClasses/Script";

// -----------------------------------------------------------------------------
// Window Container
// -----------------------------------------------------------------------------

export class App extends Component {
    static template = xml` <div class="window-manager">
    <ContainerUI t-foreach="containers()" t-as="container" t-key="container.id" node="container"  />
    <SystemUI t-foreach="scripts()" t-as="script" t-key="script_index" node="script"  />
  </div>`;
  // <Children children="containers()" />
    // <Children children="state.node.children" />
    // <t t-foreach="containers()" t-as="c" t-key="c_index" >
    // </t>
    // <ContainerUI node="c" />
    // <h1 t-out="w.attributes.id"/>
    // <pre t-out="JSON.stringify(state.node.children)" />
    //   <Children children="state.node.children" />
      // <Children children="env.ui.root.children" />
  
    // static old_template = xml` <div class="window-manager">
    //   <t t-foreach="windowService.getWindows()" t-as="w" t-key="w.id" >
    //     <Container node="w"/>
    //   </t>
    // </div>`;
    static components = { ContainerUI, SystemUI };
    // static components = { ContainerUI };
    state: any;
    env: any;
    // windowService!: WindowManager;
    // state: { node: XmlElement };

    // getChildrens()

    precontent(): string{
        debugger
        return JSON.stringify(toRaw(this.state.node).toJSON())
    }
  
    setup() {
      this.env = useEnv(); //? global env
      this.env.ui.app = this; //? usefull for later System calls
      console.log("APP.drens=", this.env.ui.root.children);
      this.state = useState({ node: this.env.ui.root });
      // this.env.ui.root.el = this;
      // console.log(this.state.node.constructor.name)
  
      useSubEnv({
        //? additional env, isolated for this instance and children
        windowService: createWindowService(),
        // bitmaps: {},
        // ui: {},
        // root: this, //? usefull for later System calls
      });
      // this.windowService = useWindowService();
  
      // onWillStart(async () => {
      // onMounted( async () => {
      // if (env.options.skin) await this.switchSkin(env.options.skin);
      // });
  
      // onMounted(() => {
      // console.log(`${name}:mounted`);
      // for (let i = 0; i < 3; i++) {
      //   this.addWindow('Hello')
      // }
      // });
    }

    
    containers(){
      return this.state.node.children.filter(c => c.tag == 'container')
    }
    scripts(){
      return this.state.node.children.filter(c => c.tag == 'script')
    }

  
    getContainers(): XmlElement[] {
      return this.env.ui.root.children.filter((c) => c.tag == "container");
      // return this.state.node.children.filter((c) => c.tag == "container");
      // return this.state.node.children.filter(c => c.tag == 'container').map(c => c.el as Container)
    }
  
    async switchSkin(skinPath: string) {
      const loader = await createSkinEngineFor(skinPath);
      loader.setEnv(this.env.ui);
  
      // loader._bitmap = this.env.bitmaps
      // await loader.loadSkin('skins/WinampModern566.wal')
      // await loader.loadSkin('skins/MMD3.wal')
      // await loader.loadSkin('skins/SimpleTutorial.wal')
      // this.env.bitmaps = loader._bitmap;
      // const tpl = loader._Containers.join('\n')
      // console.log('FINAL-TPL---------------------------\n', tpl)
      // this.tpl = xml`${tpl}`
      this.state.node = await loader.parseSkin();
  
      // loader.setEnv()
      // this.env.ui.bitmaps = loader.bitmaps()
  
      // loader.containers().forEach(node => {
      this.getContainers().forEach((node) => {
        const att = node.attributes;
        // node.id = att.id;
        att.visible = Number(
          att.default_visible == null ? 1 : att.default_visible
        );
        att.layout_id = "normal";
        const x = att["default_x"] || 0; // Number( att['default_x']) : Math.round(Math.random() * (window.innerWidth - 50));
        const y = att["default_y"] || 0; // Number( att['default_y']) : Math.round(Math.random() * (window.innerWidth - 50));
        att.x = x;
        att.y = y;
        // this.windowService.append({
        //   id: att.id,
        //   title: att.name,
        //   x,
        //   y,
        //   // width: 100,
        //   // height: 50,
        //   visible: Number(att.default_visible),
        //   children: node.children,
        //   // layouts: node.layouts,
        //   layout_id: "normal",
        //   // Component: Container,
        // });
      });
    }
  
    /* async switchSkin0(skinPath:string){
      const loader = new SkinLoader()
      // debugger
      loader._bitmap = this.env.bitmaps
      // await loader.loadSkin('skins/WinampModern566.wal')
      // await loader.loadSkin('skins/MMD3.wal')
      // await loader.loadSkin('skins/SimpleTutorial.wal')
      // this.env.bitmaps = loader._bitmap;
      // const tpl = loader._Containers.join('\n')
      // console.log('FINAL-TPL---------------------------\n', tpl)
      // this.tpl = xml`${tpl}`
      await loader.loadSkin(skinPath)
  
      loader._containers.forEach(node => {
        const att = node.attributes
        const x = att['default_x'] || 0; // Number( att['default_x']) : Math.round(Math.random() * (window.innerWidth - 50));
        const y = att['default_y'] || 0; // Number( att['default_y']) : Math.round(Math.random() * (window.innerWidth - 50));
        this.windowService.append({
          id: att.id,
          title: att.name,
          x,y,
          // width: 100,
          // height: 50,
          visible: Number(att.default_visible),
          children: node.children,
          // layouts: node.layouts,
          layout_id: 'normal',
          // Component: Container,
        })
      })
    } */
  
    say(hello: string) {
      document.title = hello;
    }
  }
  