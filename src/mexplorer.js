// This module is imported early here in order to avoid a circular dependency.
import { classResolver } from "./skin/resolver";
import { normalizedObjects, getFormattedId } from "./maki/objects";
import BaseObject from "./skin/makiClasses/BaseObject";
import { parse as parseMaki1 } from "./maki/parser";
import { parse as parseMakiXp } from "./maki/parserXp";

function hack() {
  // Without this Snowpack will try to treeshake out resolver causing a circular
  // dependency.
  classResolver("A funny joke about why this is needed.");
}

/*
async function validateSkinMaki(file: Blob) {
  const zip = await JSZip.loadAsync(file);
  const maki = zip.filter((path) => path.endsWith(".maki"));
  for (const zipFile of maki) {
    console.log(zipFile.name);
    const arraybuffer = await zip.loadAsync("arraybuffer");
    console.log(arraybuffer);
  }
}

addDropHandler(validateSkinMaki);
*/

/*
function getClass(guid: string): typeof BaseObject | null {
  try {
    return classResolver(guid);
  } catch (e) {
    return null;
  }
}
const panel = document.getElementById("panel");
const totals = document.createElement("div");
panel.appendChild(totals);
const table = document.createElement("table");
panel.appendChild(table);

const header = document.createElement("tr");
const nameHeader = document.createElement("th");
nameHeader.innerText = "Class Name";
header.appendChild(nameHeader);
const methodHeader = document.createElement("th");
methodHeader.innerText = "Methods";
header.appendChild(methodHeader);

table.appendChild(header);

const classes = [];

let total = 0;
let found = 0;
let dummy = 0;

// const params = new Proxy(new URLSearchParams(window.location.search), {
//     get: (searchParams, prop) => searchParams.get(prop),
// });
// Get the value of "some_key" in eg "https://example.com/?some_key=some_value"
// let value = params.maki; // "some_value"
const url = new URL(window.location.href);
let makiPath = url.searchParams.get("maki"); // "some_value"
console.log("maki:", makiPath);
if (!makiPath) {
  // makiPath = "/assets/skins/MMD3/scripts/songinfo.maki";
  makiPath = "/assets/skins/SimpleTutorial/SongStopper.maki";
  url.searchParams.set("maki", makiPath);
  window.history.pushState({ pageTitle: "title" }, "title", url);
  // window.location.assign(url.href)
}

async function main() {
  // async function getFileAsBytes(filePath: string): Promise<ArrayBuffer> {
  // const response = await
  fetch(makiPath).then(async (response) => {
    const scriptContents: ArrayBuffer = await response.arrayBuffer();
    if (scriptContents == null) {
      `ScriptFile file not found at path ${makiPath}`;
    } else {
      const parsedScriptXp = parseMakiXp(scriptContents);
      const parsedScript1 = parseMaki1(scriptContents, makiPath);
      explore(parsedScriptXp, parsedScript1);
    }
    // return scriptContents
  });
}

declare global {
  interface Window {
    ace: any;
  }
}

function explore(makiXp: ParsedMaki, maki: ParsedMaki) {
  const scriptXp = JSON.stringify(makiXp, null, "\t");
  const script = JSON.stringify(maki, null, "\t");
  updateEditor(scriptXp, "editor1");
  updateEditor(script, "editor2");
}
function updateEditor(txt: string, elementId: string) {
  const div = document.getElementById(elementId);
  div.textContent = txt;
  var editor = window.ace.edit(elementId);
  // editor.setTheme("ace/theme/monokai");
  editor.setTheme("ace/theme/merbivore");
  editor.getSession().setMode("ace/mode/json");
}
// this._scripts[file] = scriptContents;

main();
*/

// methodHeader.innerText += ` (${found}/${total}, ${Math.round(
//   (found / total) * 100
// )}% Complete) | ${Math.round(((found - dummy) / total) * 100)}% Real.`;

import { Component, useState, mount, xml, onWillStart, reactive, markup, useEffect } from "@odoo/owl";

function assureUrl(){
  const url = new URL(window.location.href);
  let makiPath = url.searchParams.get("maki"); // "some_value"
  console.log("maki:", makiPath);
  if (!makiPath) {
    // makiPath = "/assets/skins/MMD3/scripts/songinfo.maki";
    makiPath = "/assets/skins/SimpleTutorial/SongStopper.maki";
    url.searchParams.set("maki", makiPath);
    window.history.pushState({ pageTitle: "title" }, "title", url);
    // window.location.assign(url.href)
  }
  return makiPath;
}

class HexEdit extends Component {
  static template = xml`<div class="hexedit">
    <div class="offset">
      <t t-foreach="lines()" t-as="line" t-key="line_index">
        <div t-out="line" />
      </t>
    </div>
    <div class="hex" t-on-click="showPair">
      <span t-out="hexs()" />
    </div>
    <div class="ascii">
        <span t-out="ascii()" />
    </div>
  </div>`

  setup(){
    this.binary = useState(this.env.binary)
  }

  lines(){
    //? render line number, in hex
    // debugger
    const {data, blocks} = this.binary
    const lineCount = Math.ceil(data.length / 16)
    const lines = [...Array(lineCount).keys()].map(n => (n * 16).toString(16).padStart(6, '0'))
    // console.log('lines:',lines)
    // this.state = useState({lines})
    return lines
  }

  hexs(){
    //? render hexadecimal representation
    // debugger
    const {data, blocks} = this.binary
    function hex(offset){
      const byte = data[offset]
      return byte.toString(16).padStart(2, "0");
    }
    const rep = []; //? array of string, may contains <span>
    let i = 0; let byte
    blocks.forEach((block, block_index) => {
      const {start, end} = block;

      //? dormant
      while(i< start){
        rep.push(hex(i)+' ');
        i++
      }
      rep.push(`<span class="hilite block-${block.type}" id="hex-${block_index}" data_index="${block_index}">`)

      let mid = []
      while(i< end){
        mid.push(hex(i));
        i++
      }
      rep.push(mid.join(' ').trim())
      // console.log( mid.join(' ').trim())
      rep.push(`</span> `)
      
    });
     //? dormant
    while(i< data.length){
      rep.push(hex(i)+' ');
      i++
    }
    // const hex = data.map((b, index) =>
    //   b >= 32 && b <= 126 ? String.fromCharCode(b) : "."
    // )
    return markup( rep.join(''))
  }

  ascii(){
    //? render ascii (human readable) representation
    // debugger
    const {data, blocks} = this.binary
    const ascii = data.map((b, i) => {
      let s = b >= 32 && b <= 126 ? String.fromCharCode(b) : ".";
      if(i%16==15)
        s += ' '
      return s
    })
    return ascii.join('')
  }

  showPair(ev){
    const el = ev.target.closest('.hilite');
    if(el){
      const index = el.attributes.data_index.value
      const tree = document.getElementById(`tree-${index}`)
      tree.scrollIntoView()
      setSelected(el, tree)
    }
  }
}

class BinTree extends Component {
  static template = xml`<div>
    Bintree
    <t t-foreach="binary.blocks" t-as="block" t-key="block_index">
      <div t-attf-id="tree-#{block_index}" class="tree-item" t-att-data_index="block_index">
        <!-- <t  t-out="block.end - block.start" /> @ -->
        <!-- <t  t-out="block.start" /> -->
        <t t-out="address(block, false)" />
        <span t-attf-class="block-#{block.type}" t-out="block.type" t-on-click="showPair"/>  
        <t t-if="!block.type.startsWith('count')" t-out="'#' + block.index"/>
        <span t-if="block.children" class="toggle" t-on-click="toggleChildren">
          <t t-if="block.expanded" t-out="'⯆'"/>
          <t t-else="" t-out="'⯈'"/>
        </span>
        <span t-else="">: </span>
        <div class="inline">
          <div t-out="block.value" class="toggle" t-on-click="toggleChildren" />
          <t t-if="block.expanded"> 
            <t t-foreach="block.children" t-as="child" t-key="child_index">
              <t t-out="address(child,false)" />
              <span t-attf-class="block-#{child.type}" t-out="child.name" /> :
              <t  t-out="child.value" /><br/>
            </t>
          </t>
            
        </div>
      </div>
    </t>
  </div>`

  setup(){
    this.binary = useState(this.env.binary)
    // this.blocks = useState(this.env.binary.blocks)
    this.selected = null;
  }

  address(block, position=true){
    const len = (block.end - block.start).toString(10).padStart(3, '_')
    const at = position? ` @ ${block.start.toString(16).padStart(6, '0')} `: ''
    return markup(`<code>${len}${at}</code> `)
  }

  showPair(ev) {
    const el = ev.target.closest('.tree-item');
    const index = el.attributes.data_index.value;
    const hex = document.getElementById(`hex-${index}`)
    // if(this.selected){
    //   this.selected.classList.remove('selected')
    // }
    // this.selected = hex;
    // hex.classList.add('selected')
    hex.scrollIntoView()
    setSelected(el, hex)
  }
  toggleChildren(ev){
    const el = ev.target.closest('.tree-item');
    const index = el.attributes.data_index.value
    const block = this.binary.blocks[index]
    if(block.children){
      block.expanded = ! block.expanded
    }
  }
}

class Root extends Component {
  static template = xml`
    <div class="panel">
      <select id="file-list" t-model="state.file">
        <option value="/assets/skins/SimpleTutorial/SongStopper">SongStopper</option>
        <option value="/assets/skins/SimpleTutorial/test-script">script</option>
        <option value="/assets/skins/WinampModernPP/scripts/songinfo">Songinfo debug.sym</option>
        <option value="/assets/skins/CornerAmp_Redux/scripts/corner">corner</option>
      </select>
    </div>
    <div class="body">
      <HexEdit increment="2"/>
      <BinTree/>
    </div>
    `;
  static components = { HexEdit, BinTree };

  setup() {
    // this.state = useState({binary:[], blocks:[]});
    const makiPath = localStorage.getItem("makiPath") || ''
    this.state = useState({file: makiPath});
    this.binary = useState(this.env.binary)
    // onWillStart(async () => {
    //   const makiPath = assureUrl()
    //   // })
    // })
    useEffect(
      (makiPath) => {
        localStorage.setItem("makiPath", makiPath);
        makiPath && this.loadMaki(`${makiPath}.maki`)
      },
      () => [this.state.file]
    )
  }

  async loadMaki(makiPath){
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
}

const env = {
  binary: reactive({
    data:  [],
    blocks: [],
    selected: -1, //? block.index
  })
}

const selections = []
function setSelected(el0, el1){
  selections[0] && selections[0].classList.remove('selected')
  selections[1] && selections[1].classList.remove('selected')
  el0.classList.add('selected')
  el1.classList.add('selected')  
  selections[0] = el0
  selections[1] = el1
}

mount(Root, document.body, {env});