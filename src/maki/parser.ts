import { COMMANDS } from "./constants";
import { DataType, Variable, VariableObject } from "./v";
import MakiFile from "./MakiFile";
import { getMethod, getReturnType } from "./objects";
import { assert } from "../utils";
import { classResolver } from "../skin/resolver";

export type Command = {
  opcode: number;
  arg: number;
};

export type Method = {
  name: string;
  typeOffset: number;
  returnType: DataType;
};

export type ParsedMaki = {
  commands: Command[];
  methods: Method[];
  variables: Variable[];
  classes: string[];
  bindings: Binding[];
  version: number;
  maki_id: string;
};

export type Binding = {
  commandOffset: number;
  methodOffset: number;
  variableOffset: number;
  binaryOffset: number;
};

const MAGIC = "FG";

const PRIMITIVE_TYPES = {
  5: "BOOLEAN",
  2: "INT",
  3: "FLOAT",
  4: "DOUBLE",
  6: "STRING",
};

const knownContainerGuids = {
  "{0000000a-000c-0010-ff7b-01014263450c}": "[VIS]", // visualization
  "{45f3f7c1-a6f3-4ee6-a15e-125e92fc3f8d}": "[PL]", // playlist editor
  "{6b0edf80-c9a5-11d3-9f26-00c04f39ffc6}": "[ML]", // media library
  "{7383a6fb-1d01-413b-a99a-7e6f655f4591}": "[CON]", // config?
  "{7a8b2d76-9531-43b9-91a1-ac455a7c8242}": "[LIR]", // lyric?
  "{a3ef47bd-39eb-435a-9fb3-a5d87f6f17a5}": "[DL]", // download??
  "{f0816d7b-fffc-4343-80f2-e8199aa15cc3}": "[VIDEO]", // independent video window
};

function getClassId(guid: string): string {
  const known = knownContainerGuids[guid];
  if (known) {
    return known;
  }
  try {
    const cls: Function = classResolver(guid);
    return cls.prototype.constructor.name.replace(/_/gm, '');
  } catch (e) {
    return "--unknown--";
  }
}


class Block {
  data: {[name:string]:any}
  makiFile: MakiFile;
  
  constructor(data:{[name:string]:any}={}) {
    this.data = data;
  }

  end(data:{[name:string]:any}={}) {
    this.data.end = this.makiFile.getPosition();
    this.data = {...this.data, ...data}
  }

  newChild(data:{[name:string]:any}={}):Block{
    const child = new Block({type:'prop', ...data})
    child.data.start = this.makiFile.getPosition();
    child.makiFile = this.makiFile;
    if(!this.data.children){
      this.data.children = []
    }
    this.data.children.push(child)
    return child
  }
  // Menyediakan representasi serializable dari data
  toJSON() {
    return this.data;
  }
}

export function parse(
  data: ArrayBuffer,
  maki_id_or_filepath: string
): ParsedMaki {
  const parser = new MakiParser(data, maki_id_or_filepath);
  return parser.parse();
}

class MakiParser {
  makiFile: MakiFile;
  blocks : Block[] = [];

  findBlock(type:string, index:number):Block{
    const result = this.blocks.find(b => b.data.type==type && b.data.index == index) || new Block()
    // debugger
    return result
  }

  constructor(data: ArrayBuffer, private file_id: string) {
    this.makiFile = new MakiFile(data);
  }

  parse() {
    const makiFile = this.makiFile;

    const magic = readMagic(makiFile);
    
    // TODO: What format is this? Does it even change between compiler versions?
    let block = this.newBlock()
    // Maybe it's the std.mi version?
    const version = readVersion(makiFile);
    block.end({type:'version major',value:version})

    // Not sure what we are skipping over here. Just some UInt 32.
    // Maybe it's additional version info?
    block = this.newBlock()
    const extraVersion = makiFile.readUInt32LE();
    block.end({type:'version minor',value:extraVersion})

    const classes = this.readClasses();
    const methods = this.readMethods(classes);
    const variables = this.readVariables({classes });
    this.readConstants({ variables });
    const bindings = this.readBindings(variables);
    const commands = this.decodeCode();

    // TODO: Assert that we are at the end of the maki file
    if (!makiFile.isEof()) {
      console.warn("EOF not reached!");
    }

    // Map binary offsets to command indexes.
    // Some bindings/functions ask us to jump to a place in the binary data and
    // start executing. However, we want to do all the parsing up front, and just
    // return a list of commands. This map allows anything that mentions a binary
    // offset to find the command they should jump to.
    const offsetToCommand = {};
    commands.forEach((command, i) => {
      if (command.offset != null) {
        offsetToCommand[command.offset] = i;
      }
    });

    const resolvedBindings = bindings.map((binding): Binding => {
      return Object.assign({}, binding, {
        commandOffset: offsetToCommand[binding.binaryOffset],
      });
    });

    const resolvedCommands = commands.map((command): Command => {
      if (command.argType === "COMMAND_OFFSET") {
        return Object.assign({}, command, {
          arg: offsetToCommand[command.arg],
        });
      }
      return command;
    });

    // RESOLVE THE BINDING OF "CLASS"
    // it is because we can't mutate the variable.value at runtime
    /*
  	{
			"type": "CLASS",
			"value": null,
			"global": 0,
			"guid": "4ee3e1994becc636bc78cd97b028869c",
			"className": "GuiObj",
			"isObject": 1,
			"_index_": 11,
			"isClass": true,
			"newClassName": "NEW_CLASS_NAME-1",
			"members": [
				13,
				14,
				15,
				16,
				17,
				18,
				19,
				20,
				21,
				22
			],
			"events": [
				13,
				14
			]
		},
  */
    // for( const ivar of variables){
    //   if(ivar.isClass == true){
    //     for(const ivarOffset of ivar.members){
    //       const variable = variables[ivarOffset];
    //       for(const methodOffset of ivar.events){
    //         const binding = resolvedBindings[methodOffset];
    //         const method = methods[binding.methodOffset];
    //         const methodName = `${variable.className}.${method.name}`;
    //         resolvedBindings.push({
    //           ...binding,
    //           methodName,
    //           variableOffset: ivarOffset,
    //           // binaryOffset,
    //           // methodOffset,
    //           // variable: clone1level(variables[variableOffset])
    //           bindingOnClass: true,
    //         });
    //       }
    //     }
    //   }
    // }

    const blocks = JSON.parse(JSON.stringify(this.blocks))

    return {
      // blocks: this.blocks,
      blocks,
      classes,
      methods,
      variables,
      bindings: resolvedBindings,
      commands: resolvedCommands,
      version,
      maki_id: this.file_id,
    };
  }

  newBlock():Block{
    const b = new Block()
    b.data.start = this.makiFile.getPosition();
    b.makiFile = this.makiFile;
    this.blocks.push(b)
    return b;
  }

  readClasses(): string[] {
    let block = this.newBlock()
    let count = this.makiFile.readUInt32LE();
    block.end({type:'count', value:count})
    const classes = [];
    let i =0
    while (count--) {
      let identifier = "";
      let chunks = 4;
      block = this.newBlock()
      // let alias = block.newChild()
      while (chunks--) {
        identifier += this.makiFile.readUInt32LE().toString(16).padStart(8, "0");
      }
      const GUID = getFormattedId(identifier)
      classes.push(identifier);
      block.end({index: i++, type:'class', 'value': `${GUID} (${getClassId(identifier)})`})
      // alias.end({name:'alias', value: getClassId(identifier)})
    }
    return classes;
  }

  readMethods(classes: string[]): Method[] {
    const makiFile = this.makiFile;
    let block = this.newBlock()
    let count = makiFile.readUInt32LE();
    block.end({type:'count', value:count})
  
    const methods: Method[] = [];
    let i = 0;
    while (count--) {
      block = this.newBlock()
      let c1 = block.newChild({})
      // const classCode = makiFile.readUInt16LE();
      // c1.end({name:'classCode', value: '0x'+classCode.toString(16).padStart(4, '0')})
      // // Offset into our parsed types
      // const typeOffset = classCode & 0xff;
      const typeOffset = makiFile.readUInt8();
      c1.end({name:'class index', value: typeOffset})
      
      c1 = block.newChild({})
      const always1 = makiFile.readUInt8();
      c1.end({name:'always 1', value: always1})

      const c2 = block.newChild({})
      // This is probably the second half of a uint32
      const unknown1 = makiFile.readUInt16LE();
      c2.end({name: 'unknown', value:'0x'+unknown1.toString(16).padStart(4, '0')})
      
      const c3 = block.newChild({})
      let name = makiFile.readString(); //x2nie .toLowerCase();
      c3.end({name: 'string', value:name})
      
      const className = classes[typeOffset];
  
      // lets resolve the correct caseSensitiveName here
      const method = getMethod(className, name)
      name = method.name;
  
      const returnType = getReturnType(className, name);
  
      methods.push({ name, typeOffset, returnType });
      block.end({index: i++, type:'method', 'value':`${getClassId(className)}.${name}` })
    }
    return methods;
  }



  readVariables({ classes }) {
    const makiFile = this.makiFile;
    let block = this.newBlock()
    let count = makiFile.readUInt32LE();
    const variables: Variable[] = [];
    block.end({type:'count variables', value:count})
    let v=0;

    let i=0;
    while (count--) {
      block = this.newBlock()

      let c = block.newChild({})
      const typeOffset = makiFile.readUInt8();
      c.end({name:'class/type index', value: typeOffset})
      
      c = block.newChild({})
      const object = makiFile.readUInt8();
      c.end({name:'isObject', value: object})
      
      c = block.newChild({})
      const subClass = makiFile.readUInt16LE();
      c.end({name:'subClass', value: subClass})
      
      c = block.newChild({})
      const uinit1 = makiFile.readUInt16LE();
      c.end({name:'uinit1', value: uinit1})
      
      c = block.newChild({})
      const uinit2 = makiFile.readUInt16LE();
      c.end({name:'uinit2', value: uinit2})
      
      c = block.newChild({})
      v = makiFile.readUInt16LE(); // uinit3
      c.end({name:'UNKNOWN 1', value: v})
      
      c = block.newChild({})
      v = makiFile.readUInt16LE(); //uinit4
      c.end({name:'UNKNOWN 2', value: v})
      
      c = block.newChild({})
      const global = makiFile.readUInt8() == 1 ? true: false;
      c.end({name:'is Global', value: global})
      
      c = block.newChild({})
      v = makiFile.readUInt8(); // system
      c.end({name:'UNKNOWN 3', value: v})

      if (subClass) {
        const variable = variables[typeOffset] as VariableObject;
        if (variable == null) {
          throw new Error("Invalid type");
        } else {
          // it is a subclassing, so let's mark inheritor as CLASS (base class)
          if (!variable.members) {
            variable.isClass = true;
            // variable.type = 'CLASS';
            variable.members = [];
            variable.events = []; //method indexes
          }
        }

        // assume(false, "Unimplemented subclass variable type");
        variables.push({
          type: "OBJECT",
          value: null,
          global,
          guid: variable.guid,
          offset: variables.length,
        });
        const index = variables.length - 1;

        if (!variable.members.includes(index)) {
          variable.members.push(index);
        }
      } else if (object) {
        const klass = classes[typeOffset];
        if (klass == null) {
          throw new Error("Invalid type");
        }
        variables.push({ type: "OBJECT", value: null, global, guid: klass, offset: variables.length });
      } else {
        const typeName = PRIMITIVE_TYPES[typeOffset];
        if (typeName == null) {
          throw new Error("Invalid type");
        }
        let value = null;

        switch (typeName) {
          // BOOL
          case PRIMITIVE_TYPES[5]:
            value = uinit1;
            assert(
              value === 1 || value === 0,
              "Expected boolean value to be initialized as zero or one"
            );
            break;
          // INT
          case PRIMITIVE_TYPES[2]:
            value = uinit1;
            break;
          case PRIMITIVE_TYPES[3]:
          case PRIMITIVE_TYPES[4]:
            const exponent = (uinit2 & 0xff80) >> 7;
            const mantisse = ((0x80 | (uinit2 & 0x7f)) << 16) | uinit1;
            value = mantisse * 2.0 ** (exponent - 0x96);
            break;
          case PRIMITIVE_TYPES[6]:
            // This will likely get set by constants later on.
            break;
          default:
            throw new Error("Invalid primitive type");
        }
        const variable = {
          global,
          type: typeName,
          value,
          offset:variables.length,
        };
        variables.push(variable);
      }
      // block.end({type:'variable', 'value': JSON.stringify(variables[variables.length-1]) })
      const my = {...variables[variables.length-1]}
      delete my['offset']
      block.end({ index: i++,
        type:'variable', 
        'value': `${global? 'GLOBAL ':''}${my.type.toLowerCase()} (${my.value}) `
        // @ts-ignore
          +`${my.guid ? '['+ getClassId(my.guid) +']' : '' }  `
          // +JSON.stringify(my)
      })
    }
    return variables;
  }


  readConstants({ variables }) {
    let block = this.newBlock()
    let count = this.makiFile.readUInt32LE();
    block.end({type:'count RESSTRING', value:count})
    let i = 0;
    while (count--) {
      block = this.newBlock()
      const n = this.makiFile.readUInt32LE();
      const variable = variables[n];
      // TODO: Assert this is of type string.
      const value = this.makiFile.readString();
      // TODO: Don't mutate
      variable.value = value;
      block.end({ index: i++, type:'const',value:`"${value}"`})
    }
  }

  
  readBindings(variables: Variable[]): Binding[] {
    const makiFile = this.makiFile
    let block = this.newBlock()
    let count = makiFile.readUInt32LE();
    block.end({type:'count bindings', value:count})
    const bindings = [];
    let i = 0;
    while (count--) {
      block = this.newBlock()

      let c = block.newChild({})
      const variableOffset = makiFile.readUInt32LE();
      c.end({name:'variable index', value: variableOffset + ` | ${this.findBlock('variable', variableOffset).data.value}`})
      
      c = block.newChild({})
      const methodOffset = makiFile.readUInt32LE();
      c.end({name:'method index', value: methodOffset + ` | ${this.findBlock('method', methodOffset).data.value}`})
      
      c = block.newChild({})
      const binaryOffset = makiFile.readUInt32LE();
      c.end({name:'binary offset', value: binaryOffset})

      bindings.push({ variableOffset, binaryOffset, methodOffset });
      const aclass = variables[variableOffset];
      // @ts-ignore
      if (!aclass.events) {aclass.events = [];}
      // @ts-ignore
      aclass.events.push(bindings.length - 1);
      block.end({index: i++, type:'binding', 'value': JSON.stringify(bindings[bindings.length-1]) })
    }
    return bindings;
  }




  decodeCode() {
    const makiFile = this.makiFile
    let block = this.newBlock()
    const length = makiFile.readUInt32LE();
    block.end({type:'count (bytes) commands', value: `${length} bytes` })

    const commands = [];
    const start = makiFile.getPosition();
    let i = 0;
    while (makiFile.getPosition() < start + length) {
      block = this.newBlock()
      commands.push(this.parseComand({ start, makiFile, length, block }));
      block.end({ index: i++, type:'command', 'value': block.data.opcode+' | '+ JSON.stringify(commands[commands.length-1]) })
    }

    return commands;
  }

  // TODO: Refactor this to consume bytes directly off the end of MakiFile
  parseComand({ start, makiFile, length, block }) {
    let c: Block;
    let v;
    const pos = makiFile.getPosition() - start;

    c = block.newChild({})
    const opcode = makiFile.readUInt8();
    const cmd = COMMANDS[opcode]; //* Block stuff
    c.end({name: 'opcode', value:opcode + ` | ${cmd.name} | ${cmd.short|| ''} `})
    block.data.opcode = `${cmd.name.toUpperCase().padStart(5, '_')} | ${opcode.toString().padStart(3, ' ')}`
    block.data.offset = pos;

    const command = {
      offset: pos,
      start,
      opcode,
      arg: null,
      argType: opcodeToArgType(opcode),
    };

    if (command.argType === "NONE") {
      return command;
    }

    let arg = null;
    switch (command.argType) {
      case "COMMAND_OFFSET":
        // Note in the perl code here: "todo, something strange going on here..."
        c = block.newChild({})
        // arg = makiFile.readInt32LE() + 5 + pos;
        const raw_arg = makiFile.readInt32LE();
        arg = raw_arg + 5 + pos;

        c.end({name: 'cmd.arg', value:raw_arg})
        break;
        
      case "VARIABLE_OFFSET":
        c = block.newChild({})
        arg = makiFile.readUInt32LE();
        c.end({name: 'var.arg', value:arg})
        break;
      default:
        throw new Error("Invalid argType");
    }

    command.arg = arg;

    // From perl: look forward for a stack protection block
    // (why do I have to look FORWARD. stupid nullsoft)
    if (
      // Is there another UInt32 to read?
      length > pos + 5 + 4 &&
      makiFile.peekUInt32LE() >= 0xffff0000 &&
      makiFile.peekUInt32LE() <= 0xffff000f
    ) {
      c = block.newChild({})
      v = makiFile.readUInt32LE();
      c.end({name: 'protection?', value:v})
    }

    // TODO: What even is this?
    if (opcode === 112 /* strangeCall */) {
      c = block.newChild({})
      v = makiFile.readUInt8();
      c.end({name: 'opcode==112', value:v})
    }
    return command;
  }

}

// TODO: Don't depend upon COMMANDS
function opcodeToArgType(opcode: number) {
  const command = COMMANDS[opcode];
  if (command == null) {
    throw new Error(`Unknown opcode ${opcode}`);
  }

  switch (command.arg) {
    case "func":
    case "line":
      return "COMMAND_OFFSET";
    case "var":
    case "objFunc":
    case "obj":
      return "VARIABLE_OFFSET";
    default:
      return "NONE";
  }
}

function readMagic(makiFile: MakiFile): string {
  const magic = makiFile.readStringOfLength(MAGIC.length);
  if (magic !== MAGIC) {
    throw new Error(
      `Magic "${magic}" does not mach "${MAGIC}". Is this a maki file?`
    );
  }
  return magic;
}

function readVersion(makiFile: MakiFile): number {
  // No idea what we're actually expecting here.
  return makiFile.readUInt16LE();
}

function getFormattedId(id: string): string {
  // https://en.wikipedia.org/wiki/Universally_unique_identifier#Encoding
  const formattedId = id.toUpperCase().replace(
    /(........)(....)(....)(..)(..)(..)(..)(..)(..)(..)(..)/,
    //* "$1-$3-$2-$7$6-$5$4$11$10$9$8"
    (_, p1,p2,p3,p4,p5,p6,p7,p8,p9,pa,pb) => {
      return `{${p1}-${p3}-${p2.toLowerCase()}-${p7}${p6}-${p5}${4}${pb}${pa}${p9}${p8}}`
    }
  );
  return formattedId//.toLowerCase();
}

