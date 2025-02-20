import { Component, mount, reactive, useEffect, useState, xml } from "@odoo/owl";
import { tokenizer, parser, transformer, hideComments } from "./maki/compiler";

let input = `
// /*
#include "../../lib/std.mi"

Global Button play_button, pause_button;
Global int VISMode;
Global int num = 0;
Global Timer SongStop;
// */
// Function addInts(int a, int b);
Function int addInts(int a, int b);

play_button.onLeftClick () {
    messageBox("play_button.onLeftClick", "Success", 0, "");
}

// addInts (int a, int b)
/*int addInts (int a, int b)
{
    Int sum = a + b;
    return sum;
}*/

System.onScriptLoaded()
{
    SongStop = new Timer;
    messageBox("onScriptLoaded", "Success", 0, "");

    play_button = getContainer("main").getLayout("normal").findObject("Play");

    // play_button.leftClick();
}
SongStop.onTimer(){
    // if(getPosition() >= 5000){
        SongStop.stop();
        System.pause();
    // }
    debugtext.setText(integerToString(getPosition()));
}

`;

const std_mi0 = `
//--------------------------------------------
// std.mi
//
// standard definitions for internal objects
//--------------------------------------------


#ifndef __STD_MI
#define __STD_MI

#ifndef true
    #define true 1
#endif
#ifndef false
    #define false 0
#endif


#define MC_TARGET "Winamp 5.66 (skin version 1.36)"
#define VCPU_VERSION 2


#define MC_TARGET "Winamp 5.02 (skin version 1.1)"

// GUIDS
/*extern class @{51654971-0D87-4a51-91E3-A6B53235F3E7}@ @{00000000-0000-0000-0000-000000000000}@ Object;
extern class @{D6F50F64-93FA-49b7-93F1-BA66EFAE3E98}@ Object _predecl System;
extern class @{E90DC47B-840D-4ae7-B02C-040BD275F7FC}@ Object GuiObject;
extern class @{B2023AB5-434D-4ba1-BEAE-59637503F3C6}@ Object &Layer;
extern class @{5D0C5BB6-7DE1-4b1f-A70F-8D1659941941}@ Object &Timer;
extern class @{6B64CD27-5A26-4c4b-8C59-E6A70CF6493A}@ Layer &AnimatedLayer;
extern class @{2D2D1376-BE0A-4CB9-BC0C-57E6E4C999F5}@ GuiObject &Form;
*/
extern class @{51654971-0D87-4a51-91E3-A6B53235F3E7}@ @{00000000-0000-0000-0000-000000000000}@ Object;
extern class @{D6F50F64-93FA-49b7-93F1-BA66EFAE3E98}@ Object _predecl System;
extern class @{E90DC47B-840D-4ae7-B02C-040BD275F7FC}@ Object Container;
deprecated extern class @{00C074A0-FEA2-49a0-BE8D-FABBDB161640}@ Object Wac; 
extern class @{B2023AB5-434D-4ba1-BEAE-59637503F3C6}@ Object &List;
extern class @{87C65778-E743-49fe-85F9-09CC532AFD56}@ Object &BitList;
extern class @{38603665-461B-42a7-AA75-D83F6667BF73}@ Object &Map;
extern class @{F4787AF4-B2BB-4ef7-9CFB-E74BA9BEA88D}@ Object &PopupMenu;
extern class @{3A370C02-3CBF-439f-84F1-86885BCF1E36}@ Object &Region;
extern class @{5D0C5BB6-7DE1-4b1f-A70F-8D1659941941}@ Object &Timer;
deprecated extern class @{A5376FA1-4E94-411a-83F6-05EC5EEA5F0A}@ Object &FeedWatcher;
extern class @{4EE3E199-C636-4bec-97CD-78BC9C8628B0}@ Object &GuiObject;
extern class @{45BE95E5-2072-4191-935C-BB5FF9F117FD}@ GuiObject &Group;
extern class @{60906D4E-537E-482e-B004-CC9461885672}@ Group &Layout;
extern class @{403ABCC0-6F22-4bd6-8BA4-10C829932547}@ GuiObject &WindowHolder;
extern class @{97AA3E4D-F4D0-4fa8-817B-0AF22A454983}@ GuiObject &ComponentBucket;
extern class @{64E4BBFA-81F4-49d9-B0C0-A85B2EC3BCFD}@ GuiObject &Edit;
extern class @{62B65E3F-375E-408d-8DEA-76814AB91B77}@ GuiObject &Slider;
extern class @{CE4F97BE-77B0-4e19-9956-D49833C96C27}@ GuiObject &Vis;
extern class @{A8C2200D-51EB-4b2a-BA7F-5D4BC65D4C71}@ GuiObject &Browser;
extern class @{8D1EBA38-489E-483e-B960-8D1F43C5C405}@ GuiObject &EqVis;
extern class @{0F08C940-AF39-4b23-80F3-B8C48F7EBB59}@ GuiObject &Status;
extern class @{EFAA8672-310E-41fa-B7DC-85A9525BCB4B}@ GuiObject &Text;
extern class @{7DFD3244-3751-4e7c-BF40-82AE5F3ADC33}@ GuiObject &Title;
extern class @{5AB9FA15-9A7D-4557-ABC8-6557A6C67CA9}@ GuiObject &Layer;
extern class @{698EDDCD-8F1E-4fec-9B12-F944F909FF45}@ GuiObject &Button;
extern class @{6B64CD27-5A26-4c4b-8C59-E6A70CF6493A}@ Layer &AnimatedLayer;
extern class @{6DCB05E4-8AC4-48c2-B193-49F0910EF54A}@ Layer &AlbumArtLayer;
extern class @{B4DCCFFF-81FE-4bcc-961B-720FD5BE0FFF}@ Button &ToggleButton;
extern class @{01E28CE1-B059-11d5-979F-E4DE6F51760A}@ GuiObject &GroupList;
extern class @{80F0F8BD-1BA5-42a6-A093-3236A00C8D4A}@ Group &CfgGroup;
deprecated extern class @{CDCB785D-81F2-4253-8F05-61B872283CFA}@ GuiObject &QueryList;
extern class @{9B2E341B-6C98-40fa-8B85-0C1B6EE89405}@ GuiObject &MouseRedir;
extern class @{36D59B71-03FD-4af8-9795-0502B7DB267A}@ GuiObject &DropDownList;
extern class @{7FD5F210-ACC4-48df-A6A0-5451576CDC76}@ GuiObject &LayoutStatus;
extern class @{B5BAA535-05B3-4dcb-ADC1-E618D28F6896}@ GuiObject &TabSheet;
extern class @{6129FEC1-DAB7-4d51-9165-01CA0C1B70DB}@ GuiObject &GuiList;
extern class @{D59514F7-ED36-45e8-980F-3F4EA0522CD9}@ GuiObject &GuiTree;
extern class @{9B3B4B82-667A-420e-8FFC-794115809C02}@ Object &TreeItem;
deprecated extern class @{1D8631C8-80D0-4792-9F98-BD5D36B49136}@ GuiObject &MenuButton;
extern class @{C7ED3199-5319-4798-9863-60B15A298CAA}@ GuiObject &CheckBox;
deprecated extern class @{2D2D1376-BE0A-4CB9-BC0C-57E6E4C999F5}@ GuiObject &Form;
extern class @{E2BBC14D-84F6-4173-BDB3-B2EB2F665550}@ GuiObject &Frame;	// Winamp 5.5
extern class @{73C00594-961F-401B-9B1B-672427AC4165}@ GuiObject	&Menu;	// Winamp 5.52


#define WindowHolder Component

// class tree member functions & events

extern TreeItem.editLabel();
extern Int TreeItem.hasSubItems();

//*****************************************************************************
// Object CLASS
//*****************************************************************************
/**
 Object Class.

 @short    This is the base class from which all other classes inherit.
 @author   Nullsoft Inc.
 @ver  1.0
*/

/**
 getClassName()

 Returns the class name for the object.

 @ret The class name.
*/
extern String Object.getClassName();

/**
 getId()

*/
extern String Object.getId();

/**
 onNotify()

 @ret
 @param  command
 @param  param
 @param  a
 @param  b
*/
extern Int Object.onNotify(String command, String param, int a, int b);

extern System.onScriptLoaded();
extern Int System.messageBox(String message, String msgtitle, Int flag, String notanymore_id);

extern GuiObject GuiObject.findObject(String id);

extern Container System.getContainer(String container_id);

extern Layout Container.getLayout(String layout_id);

extern Button.onLeftClick();
extern Button.leftClick();
extern Button.rightClick();

// predecl system symbols
.CODE

    // This function is called by System.onScriptLoaded() as the first thing it does. 
    // Subsequent events check
    // __deprecated_runtime before continuing. If you have no System.onScriptLoaded(), 
    // you will have no version check.

    // This is to ensure that runtimes that do not have stack protection (that is wa3, 
    // wa5 and wa5.01) do not crash when trying to unexisting functions (with 
    // parameters, since parameterless functions would not crash), that is, functions 
    // that are meant for a higher version number than that of the runtime
    // the script is running on.

Function Int versionCheck();

Int versionCheck()
{
    Double v = getRuntimeVersion();
    if (v < VCPU_VERSION || v > 65535)
    {
        __deprecated_runtime = 1;
        int last = getPrivateInt(getSkinName(), "runtimecheck", 0);
        int now = getTimeOfDay();
        if (now - last < 5000 && last < now)
            return 0;
        setPrivateInt(getSkinName(), "runtimecheck", getTimeOfDay());
        messageBox("This script requires " + MC_TARGET, "Error", 1, "");
        return 0;
    }
    return 1;
}

// begin protecting the stack, anything below this requires a getRuntimeVersion() >= 1 and <= 65535
.STACKPROT


#endif
`;
import std_mi from "./std_mi_566";
import { BinTree } from "./hexedit";
import MakiWriter from "./maki/MakiFileWriter";

const song_stopper_m = `
#include <lib/std.mi>

Global Text debugtext;
Global Timer SongStop;
Global int i;

System.onScriptLoaded(){
    Group player = getScriptGroup();
    debugtext = player.findObject("debugtext");
    SongStop = new Timer;
    SongStop.setDelay(100);
}

// System.onInfoChange(String info){
System.onPlay(){
    SongStop.start();
}
System.onResume(){
    SongStop.start();
}

SongStop.onTimer(){
    // if(getPosition() >= 5000){
        SongStop.stop();
        System.pause();
    // }
    debugtext.setText(integerToString(getPosition()));
}

`

// window.loaded()
// async function fileChange(ev) {
//     console.log(ev.target.value)
//     const url = `${ev.target.value}.m`
//     const response = await fetch(url);
//     if (!response.ok) {
//         throw new Error(`Response status: ${response.status}`);
//     }
//     const input = await response.text();
//     updateUI(input)
// }

//? DEMO
// const comboobox = document.getElementById('file-list')
// comboobox.onchange = fileChange

// const makiPath = localStorage.getItem("makiPath")
// if (makiPath) {
//     comboobox.value = makiPath
// }
// else {
// Dispatch it.
// comboobox.dispatchEvent(new Event('change'));
// }


class Root extends Component {
    static template = xml`
      <div class="body">
        <!-- <HexEdit increment="2"/> -->
        <div>
            <h3>Code 
            <select id="file-list" t-model="state.file">
                <option value="/assets/skins/SimpleTutorial/SongStopper">SongStopper</option>
                <option value="/assets/skins/SimpleTutorial/test-script">script</option>
                <option value="/assets/skins/WinampModernPP/scripts/songinfo">Songinfo debug.sym</option>
                <option value="/assets/skins/CornerAmp_Redux/scripts/corner">corner</option>
            </select>
            </h3>
            <pre id="code" class="half"></pre>
            <pre id="std" class="half"></pre>
        </div>
        <div><h3>Token</h3><pre id="token"></pre></div>
        <div><h3>AST </h3><pre id="parsed"></pre></div>
        <div><h3>Transformed <span t-on-click="generateBinary"> download </span> </h3><pre id="transformed"></pre></div>
        <div><h3>Variables</h3><pre id="variables"></pre></div>
        <!-- <div><h3>Processed</h3><pre id="processed"></pre></div> -->
        <!-- <div><h3>Generated</h3><pre id="generated"></pre></div> -->
        <BinTree/>
      </div>
      `;
    static components = { BinTree };

    setup() {
        // this.state = useState({binary:[], blocks:[]});
        const makiPath = localStorage.getItem("makiPath") || ''
        this.state = useState({ 
            file: makiPath 
        });
        this.binary = useState(this.env.binary)
        // onWillStart(async () => {
        //   const makiPath = assureUrl()
        //   // })
        // })
        useEffect(
            (makiPath) => {
                localStorage.setItem("makiPath", makiPath);
                makiPath && this.fileChange(`${makiPath}.m`)
                // makiPath && this.loadMaki(`${makiPath}.maki`)
            },
            () => [this.state.file]
        )
    }

    async fileChange(url) {
        console.log(url)
        // const url = url
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const input = await response.text();
        this.updateUI(input)
    }

    updateUI(input) {
        // input = std_mi
        // input = song_stopper_m
        // input = song_stopper_m
        document.getElementById('code').innerText = input
        input = std_mi + input
        document.getElementById('std').innerText = std_mi
    
        input = hideComments(input)
        const tokens = tokenizer(input); document.getElementById('token').innerText = JSON.stringify(tokens, null, 2)
        // console.log(tokens)
        const ast = parser(tokens.filter(tk => tk != null & tk.type != 'comment')); document.getElementById('parsed').innerText = JSON.stringify(ast, null, 2)
        const ast2 = transformer(ast); document.getElementById('transformed').innerText = JSON.stringify(ast2, null, 2);
        document.getElementById('variables').innerText = JSON.stringify(ast2.variables, null, 2)
        this.buildMaki(ast2);
    }

    buildMaki(ast){
        const f = new MakiWriter()
        f.writeUint16(0x4647) // FG
        f.writeUint16(0x0304) // Version
        f.writeUint32LE(0x17); // Version

        //? class registry
        f.writeUint32LE(ast.registry.length); // Version
        ast.registry.forEach(reg => f.writeGUID(reg.key))

        //? method
        f.writeUint32LE(ast.methods.length); // Version
        ast.methods.forEach(fun => {
            f.writeUint8(fun.classOffset)
            f.writeUint8(1)     //? always 1
            f.writeUint16(0)    //? unknown
            f.writePascalString(fun.methodName)
        })
        
        //? variables
        f.writeUint32LE(ast.variables.length); // Version
        ast.variables.forEach(variable => {
            const isObject = variable.classIndex && variable.classIndex >=0;
            const typeOffset = isObject? variable.classIndex : PRIMITIVE_TYPES[variable.type.toUpperCase()] || 255;
            f.writeUint8(typeOffset)
            f.writeUint8(isObject? 1 : 0)
            //TODO:
            f.writeUint16LE(0)     //? isSubclass 

            f.writeUint16LE(0)     //? uinit1 
            f.writeUint16LE(0)     //? uinit2 
            f.writeUint16LE(0)     //? UNKNOWN 1 
            f.writeUint16LE(0)     //? UNKNOWN 2 
            f.writeUint8(variable.isGlobal? 1 : 0)      //? Global
            f.writeUint8(variable.predeclared? 1 : 0)   //? System
        })
        
        // debugger
        this.binary.binary = f.getData()
    }

    async loadMaki(makiPath) {
        // fetch(makiPath).then(async (response) => {
        const response = await fetch(makiPath);
        const scriptContents = await response.arrayBuffer();
        if (scriptContents == null) {
            `ScriptFile file not found at path ${makiPath}`;
        } else {
            const data = new Uint8Array(scriptContents);
            this.binary.data = [...data];
            // console.log( new Uint8Array(scriptContents));
            // const parsedScriptXp = parseMakiXp(scriptContents);
            // const parsedScript1 = parseMaki1(scriptContents, makiPath);
            const parsedScriptXp = parseMaki1(scriptContents);
            // explore(parsedScriptXp, parsedScript1);
            this.binary.blocks = parsedScriptXp.blocks
            console.log(parsedScriptXp)
        }
    }

    generateBinary(){
        if(!this.binary.binary) return;

        const path = this.state.file.split('/');
        const filename = path[path.length-1] + '.maki'
        const blob = new Blob([this.binary.binary], { type: "application/octet-stream" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

const PRIMITIVE_TYPES = {
    "BOOLEAN": 5,
    "INT": 2,
    "FLOAT": 3,
    "DOUBLE": 4,
    "STRING": 6,
  };

const env = {
    binary: reactive({
        binary: null,
        code: '',       //? source code
        data: [],
        blocks: [],
        selected: -1,   //? block.index
    })
}

mount(Root, document.body, { env });