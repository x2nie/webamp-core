import { Component, xml, useState, markup } from "@odoo/owl";

// import './hexedit.css'

export class HexEdit extends Component {
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

  setup() {
    this.binary = useState(this.env.binary)
  }

  lines() {
    //? render line number, in hex
    // debugger
    const { data, blocks } = this.binary
    const lineCount = Math.ceil(data.length / 16)
    const lines = [...Array(lineCount).keys()].map(n => (n * 16).toString(16).padStart(6, '0'))
    // console.log('lines:',lines)
    // this.state = useState({lines})
    return lines
  }

  hexs() {
    //? render hexadecimal representation
    // debugger
    const { data, blocks } = this.binary
    function hex(offset) {
      const byte = data[offset]
      return byte.toString(16).padStart(2, "0");
    }
    const rep = []; //? array of string, may contains <span>
    let i = 0; let byte
    blocks.forEach((block, block_index) => {
      const { start, end } = block;

      //? dormant
      while (i < start) {
        rep.push(hex(i) + ' ');
        i++
      }
      rep.push(`<span class="hilite block-${block.type}" id="hex-${block_index}" data_index="${block_index}">`)

      let mid = []
      while (i < end) {
        mid.push(hex(i));
        i++
      }
      rep.push(mid.join(' ').trim())
      // console.log( mid.join(' ').trim())
      rep.push(`</span> `)

    });
    //? dormant
    while (i < data.length) {
      rep.push(hex(i) + ' ');
      i++
    }
    // const hex = data.map((b, index) =>
    //   b >= 32 && b <= 126 ? String.fromCharCode(b) : "."
    // )
    return markup(rep.join(''))
  }

  ascii() {
    //? render ascii (human readable) representation
    // debugger
    const { data, blocks } = this.binary
    const ascii = data.map((b, i) => {
      let s = b >= 32 && b <= 126 ? String.fromCharCode(b) : ".";
      if (i % 16 == 15)
        s += ' '
      return s
    })
    return ascii.join('')
  }

  showPair(ev) {
    const el = ev.target.closest('.hilite');
    if (el) {
      const index = el.attributes.data_index.value
      const tree = document.getElementById(`tree-${index}`)
      tree.scrollIntoView()
      setSelected(el, tree)
    }
  }
}


export class BinTree extends Component {
  static template = xml`<div class="bintree">
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

  setup() {
    this.binary = useState(this.env.binary)
    // this.blocks = useState(this.env.binary.blocks)
    this.selected = null;
  }

  address(block, position = true) {
    const len = (block.end - block.start).toString(10).padStart(3, '_')
    const at = position ? ` @ ${block.start.toString(16).padStart(6, '0')} ` : ''
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
  toggleChildren(ev) {
    const el = ev.target.closest('.tree-item');
    const index = el.attributes.data_index.value
    const block = this.binary.blocks[index]
    if (block.children) {
      block.expanded = !block.expanded
    }
  }
}


const selections = []
function setSelected(el0, el1) {
  selections[0] && selections[0].classList.remove('selected')
  selections[1] && selections[1].classList.remove('selected')
  el0.classList.add('selected')
  el1.classList.add('selected')
  selections[0] = el0
  selections[1] = el1
}