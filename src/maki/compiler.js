import { buildExpressionTree, parseFunctionArguments } from "./astTree";
import { OPCODES } from "./constants";
import { generateIR } from "./ir";

function hideComments(code) {
    //? replace anything inside comments with space, but preserve new line
    return code
        .replace(/\/\/[^\n]*/g, match => ' '.repeat(match.length)) // Ganti komentar satu baris dengan spasi
        .replace(/\/\*[\s\S]*?\*\//g, match => match.replace(/[^\r\n]/g, ' ')); // Ganti kecuali \r dan \n
}
// Tokenizer
function tokenizer(input) {
    const tokens = [];
    let current = 0;
    
    const WHITESPACE = /\s/;
    const NUMBERS = /[0-9]/;
    const LETTERS = /[a-z_]/i;
    const GUID = /[0-9\-A-Za-z ]/i;
    const KEYWORDS = 'extern global new class function for if ifnot else return'.split(' ')
    const TWINS = ['++', '--', '&&', '||', '<<', '==', '>>', '!=', '<=', '>=']

    let spaced = false; //? whether any space preceded the token. needed by ++|--
    while (current < input.length) {
        let char = input[current];

        // Skip whitespace
        if (WHITESPACE.test(char)) {
            current++;
            spaced = true;
            continue;
        } else {
            spaced = false;
        }

        if (char === '/' && input[current + 1] == '/') {
            let value = char;
            char = input[++current];
            while (char !== '\n' && current < input.length) {
                value += char;
                char = input[++current];
            }
            tokens.push({
                type: 'comment',
                // value: value.trim() 
            });
            continue;
        }

        if (char === '/' && input[current + 1] == '*') {
            current++
            current++
            let value = '/*';
            char = input[current++];
            value += char;
            let lastChar = null;
            while (!(char == '/' && lastChar == '*') && current < input.length) {
                lastChar = char;
                char = input[current++];
                value += char;
            }
            tokens.push({
                type: 'comment',
                // value: value.trim() 
            });
            // console.log(value)
            continue;
        }

        if (char === '@' && input[current + 1] == '{') {
            current++
            current++
            let value = '';
            char = input[current++];
            while (GUID.test(char)) {
                value += char.trim();
                char = input[current++];
            }
            current++
            current++
            tokens.push({
                type: 'guid',
                value: value.trim()
            });
            continue;
        }

        // Handle preprocessor directives (e.g., #include)
        if (char === '#') {
            let name = '';
            char = input[++current];
            while ((LETTERS.test(char) || NUMBERS.test(char)) && current < input.length) {
                name += char;
                char = input[++current];
            }
            // if (name == 'endif') {
            //     debugger
            // }
            let value = '';
            char = input[current];
            while (char !== '\n' && current < input.length) {
                value += char;
                char = input[++current];
            }

            let data
            if (name == 'include') {
                data = value
            } else {
                data = tokenizer(value.trim())
            }
            tokens.push({ type: 'macro', name, data });
            continue;
        }

        // Handle numbers
        if (NUMBERS.test(char)) {
            let value = '';
            while (NUMBERS.test(char)) {
                value += char;
                char = input[++current];
            }
            tokens.push({ type: 'number', value });
            continue;
        }

        // Handle letters (keywords, identifiers)
        if (LETTERS.test(char)) {
            let value = '';
            while ((LETTERS.test(char) || NUMBERS.test(char)) && current < input.length) {
                value += char;
                char = input[++current];
            }

            // Check if it's a keyword or type
            if (KEYWORDS.includes(value.toLowerCase())) {
                tokens.push({ type: 'keyword', value });
            } else {
                tokens.push({ type: 'identifier', value });
            }
            continue;
        }

        // Handle strings
        if (char === '"') {
            let value = '';
            char = input[++current];
            while (char !== '"') {
                value += char;
                char = input[++current];
            }
            tokens.push({ type: 'string', value });
            current++;
            continue;
        }

        // Handle symbols
        if (char === '.') {
            tokens.push({
                type: 'dot',
                value: '.'
            });
            current++;
            continue;
        }
        if (char === ',') {
            tokens.push({
                type: 'comma',
                value: ','
            });
            current++;
            continue;
        }

        if (char === ';') {
            tokens.push({
                type: 'semi',
                value: ';'
            });
            current++;
            continue;
        }

        // Handle other symbols
        tokens.push({ type: 'symbol', value: char });
        current++;

        // handle twin-symbol
        let lastChar = char
        char = input[current];
        if(tokens[tokens.length-1].type=='symbol' && TWINS.includes(lastChar + char)){
            if(input[current-2] == '(' || input[current-2] == ' ') spaced = true;

            tokens[tokens.length-1].value += char;
            if(['++', '--'].includes(lastChar + char)){
                tokens[tokens.length-1].type = spaced? 'preincremental' :  'postincremental';
            }
            current++
        }
    }

    return tokens;
}
// Parser
function parser(tokens) {
    let current = 0;

    function nextis(type, i = 0) {
        let token = tokens[current + i]
        return token && token.type == type
    }
    function next(i = 0) {
        let token = tokens[current + i]
        return (token && token.value) || ''
    }

    function walk() {
        let token = tokens[current]; let value;

        // Handle preprocessor directives (ignore them)
        if (token.type === 'comment') {
            current++;
            return null; // Skip preprocessor directives
        }

        if (token.type === 'macro') {
            current++;
            if (token.name == 'ifdef' || token.name == 'ifndef') {
                //? such as #ifndef __STD_MI is crucial, it may take|ignore whole file
                // const block = [];
                const start = ast.body.length;
                while (!(tokens[current].type == 'macro' && tokens[current].name == 'endif')) {
                    // data.push(tokens[current]);
                    // block.push(walk());
                    ast.body.push(walk())
                    // current++;
                }
                // debugger
                const block = ast.body.splice(start, ast.body.length - start+1)
                current++;
                return {
                    // type: 'Ifdef',
                    type: 'IfDefined',
                    // type: capitalizeFirstLetter(token.name),
                    ifdef: token.name.toLowerCase() == 'ifdef',
                    name: token.name,
                    // data: token.data,
                    expect: token.data[0].value,
                    body: block
                }
            }

            if (token.name == 'define') {
                return {
                    type: 'Define',
                    name: token.data[0].value,
                    value: token.data[1] || {type:null}, //? sometime `#define` has no value
                }
            }
            return token
            return null; // Skip preprocessor directives
        }

        //* .CODE  | .STACKPROT
        if (token.type === 'dot' && next(1).toUpperCase() == next(1)) {
            current++;
            token = tokens[current++];
            return {
                type: 'Predecl',
                name: `.${token.value}`,
            }
        }

        if (token.value === 'extern' && nextis('keyword', 1)) {
            const deprecated = next(-1) == 'deprecated'
            current++;
            token = tokens[current++];
            // const name = token.value;
            // current += 2; // Skip identifier and '('
            const data = [];
            while (tokens[current].value !== ';') {
                // data.push(tokens[current]);
                data.push(walk());
                // current++;
            }
            current++; // Skip ')'
            return {
                type: 'ClassRegistry',
                varType: token,
                data,
                deprecated,
            };
        }
        else if (token.value === 'extern') {
            current++;
            let retType = null
            let node = walk()
            if(node.type=='identifier'){
                retType = node.name || node.value
                node = walk()
            }
            current++; //* skip semicolon
            node.type = 'ExternalMethod'
            node.retType = retType
            return node;
        }

        //? UNARY

        // Handle pre-increment (++num)
        if (token.type === 'preincremental' /* && (nextis('number', 1) || nextis('identifier', 1)) */ ) {
            current++; // Skip '++'
            const value = walk(); // Get the operand (e.g., 'num')
            return {
                type: 'PreIncrement',
                operator: token.value,
                value,
            };
        }

        // Handle post-increment (num++)
        if (['number', 'identifier'].includes(token.type)  && nextis('postincremental', 1) ) {
        // if (token.type === 'postincremental') {
            // debugger
            // const value = ast.body.pop();
            const value = {
                ...token,
                type: token.type == 'number'? 'NumberLiteral' : 'identifier'
            }
            // debugger
            // current += 2; // Skip 'num' and '++'
            current++;
            token = tokens[current++];
            return {
                type: 'PostIncrement',
                operator: token.value,
                value,
            };
        }

        if (token.type === 'symbol' && token.value === '!') {
            current++;
            let expression = walk(); // my identifer | parameters
            if(expression.type == 'Parameters'){
                expression = buildExpressionTree(expression.params)
            }
            return {
                type: 'NotExpression',
                operator: token.value,
                value: expression,
            }
        }


        // Handle numbers
        if (token.type === 'number') {
            current++;
            return {
                type: 'NumberLiteral',
                value: token.value,
            };
        }

        // Handle strings
        if (token.type === 'string') {
            current++;
            return {
                type: 'StringLiteral',
                value: token.value,
            };
        }
        if (token.type === 'keyword' && token.value === 'new') {
            current++;
            return {
                type: 'Instanciate',
                target: tokens[current++],
            };
        }

        // Handle identifiers
        if (token.type === 'identifier') {
            value = token.value;
            current++
            if (nextis('dot') && nextis('identifier', 1)) {
                token = tokens[current++];
                value += token.value;
                token = tokens[current++];
                value += token.value;
            }
            const node = {
                type: 'identifier',
                name: value,
            };
            if (next() == '(') {                    //? it maybe a FuncDec or a Call
                const params = walk();
                
                if (next() == '{') {                //? its a FuncDef
                    node.type = "FunctionDeclaration"
                    params.params = tokens2parameters(params.params)
                    // debugger
                    if(ast.body.length && ast.body[ast.body.length-1].type == 'identifier'){
                        const theType = ast.body.pop()
                        node.retType = theType.name;
                    }
                    node.parameters = params.params
                    node.body = walk().body;    //? codeDomain
                } else {
                    node.type = "CallExpression"
                    // node.arguments = params.params.filter(el => el.type != 'comma')
                    node.arguments = parseFunctionArguments(params.params)
                    // current++
                }
            }
            // else if(nextis('identifier')){
            //     node.type = 'LocalVar'
            //     node.varType = value
            //     token = tokens[current++];
            //     node.name = token.value
            // }
            return node
        }

        // Handle types (e.g., int)
        // if (token.type === 'keyword' && token.value === 'int') {
        //     current++;
        //     return {
        //         type: 'Type',
        //         name: 'int',
        //     };
        // }

        // Handle assignment (=)
        // if (token.type === 'assignment') {
        //     current++;
        //     const left = walk(); // Get the variable name
        //     const right = walk(); // Get the assigned value
        //     return {
        //         type: 'Assignment',
        //         left,
        //         right,
        //     };
        // }

        // Handle dots (.)
        if (token.type === 'dot') {
            current++;
            // const object = walk(); // Get the object
            // const property = walk(); // Get the property or method
            const value = walk(); // Get the property or method
            return {
                type: 'MemberExpression',
                // object,
                // property,
                value
            };
        }

        // Handle symbols (e.g., commas, semicolons)
        // if (token.type === 'symbol') {
        //     if (token.value === ',' || token.value === ';') {
        //         current++;
        //         return null; // Skip commas and semicolons
        //     }
        // }

        // Handle function declarations
        if (token.type === 'keyword' && token.value === 'Function') {
            current++
            let node = {
                type: 'UserFunction_h',
                retType: null,
            }
            // token = tokens[current++]; // Skip 'Function'
            // let retType = null;
            // let name = token.value;
            if (nextis('identifier') && nextis('identifier', 1)) {
                token = tokens[current++]; // Skip '('
                node.retType = token.value;
                // node = {...token, node}
            }

            // token = tokens[++current]; // Skip '('
            // const params = [];
            let params = walk();
            params.arguments = tokens2parameters(params.arguments)
            node = { ...params, ...node }
            // Object.assign(node, params)
            // token = tokens[++current];

            // while (token.value !== ')') {
            //     params.push(walk());
            //     token = tokens[current];
            // }

            current++; // Skip ';'

            // const body = [];
            // token = tokens[current];

            // while (token.value !== '}') {
            //     body.push(walk());
            //     token = tokens[current];
            // }

            // current++; // Skip '}'

            return node;
        }

        // Handle global declarations
        if (token.type === 'keyword' && token.value === 'Global') {
            current++;
            const varType = tokens[current++].value;
            const declarations = [];
            let last = null
            while (tokens[current].value !== ';') {
                token = tokens[current++];
                if (token.type == 'identifier') {
                    declarations.push(token);
                } else if (token.value == ',') {
                    continue // Skip commas
                } else if (token.value == '=') {
                    const expression = walk();
                    last.defaultValue = expression;
                } else {
                    throw new TypeError(`Expected identifier: ${token.value}`);
                }
                // if (declaration != null) { 
                // declarations.push(declaration);
                // }
                // current++;
                last = token;
            }
            current++; // Skip ';'
            return {
                type: 'GlobalDeclaration',
                varType,
                declarations,
            };
        }

        if (token.type === 'keyword' && (token.value === 'if' || token.value == 'ifnot')) {
            current++;
            // if(nextis('postincremental', 2)) debugger;
            // if(nextis('preincremental', 1)) debugger;
            const truthy = walk()
            var node = {
                type: 'IfExpression',
                ifnot: token.value == 'ifnot'? true: undefined,
                // expect: walk(),
                expect: buildExpressionTree(truthy.params),
                body: [],
                'else': [],
            };
            var later = walk()
            if(later.type=='CodeDomain')
                node.body = later.body;
            else
            // if (nextis('symbol')) {
                node.body.push(later)
            // }
            // if(nextis('semi')) current++; //semi
            if(next()=='else') {
                // node.else.push( walk() )
                node.else = walk().body //? ElseExpression
                // debugger
            }
            else if(next(1)=='else') {
                current++;
                // node.else.push( walk() )
                node.else = walk().body //? ElseExpression
                // debugger
            }
            return node
        }
        if (token.type === 'keyword' && token.value === 'else') {
            //? handle `else`

            // token = tokens[++current];
            // if (nextis('keyword') && next('else')) {
                current++;
                const node = {
                    type: 'ElseExpression',
                    // expect: walk(),
                    body: [],
                    // 'else': null,
                };
                // node.else = []
                later = walk()
                if(later.type=='CodeDomain')
                    node.body = later.body;
                else
                    node.body.push(later)
            // }
            if(nextis('semi')) current++; //semi
            return node
        }

        if (token.type === 'keyword' && token.value === 'for') {
            current++;
            var node = {
                type: 'ForExpression',
                expect: walk(),
                body: [],
                else: null,
            };
            var later = walk()
            if(later.type=='CodeDomain')
                node.body = later.body;
            else
            // if (nextis('symbol')) {
                node.body.push(later)
            // }
            if(nextis('semi')) current++; //semi
            return node
        }


        if (token.type === 'keyword' && token.value == 'return') {
            // token = tokens[++current]
            current++;
            token = nextis('semi') ? {type:'identifier', value:'NULL'} : walk();
            return {
                type: 'Return',
                value: token,
            }; 
        }

        if (token.value === '{' && token.type == 'symbol') {
            token = tokens[++current];
            // let prevToken = tokens[current - 2];
            // if (typeof(prevToken) != 'undefined' && prevToken.type === 'name') {
            var node = {
                type: 'CodeDomain',
                // name: prevToken.value,
                body: []
            };
            const COMPLETE_STATEMENT = ['semi','Terminator', "ExpressionStatement", 'IfExpression', 'ElseExpression', 'ForExpression', 'CodeDomain']
            while (token && !(token.value == '}' && token.type == 'symbol')) {
                // node.body.push(walk());
                token = tokens[current];
                const body = []
                while (token && !COMPLETE_STATEMENT.includes(token.type) && !(token.value == '}' && token.type == 'symbol')) {
                    // body.push(walk());
                    const c = walk();
                    c && body.push(c);
                    token = tokens[current];
                    // if(!token) debugger;
                }
                // console.log('found a statement:', body)
                // const statement = {
                //     type: 'ExpressionStatement',
                //     body: parseStatement(body.filter(token => token != null)),
                // }
                const statements = parseStatement(body.filter(token => token != null))
                // statements.forEach(statement => node.body.push(statement))
                statements.forEach(statement => {
                    //? this wrap is for stack protection: no stack leaves in the end of statement
                    node.body.push({
                        type: 'ExpressionStatement',
                        body: [statement],
                    })
                })
                // if(statements.length > 1){
                //     debugger
                // } else {
                //     node.body.push(statement)
                // }
                if(!token)
                    break
                if(!(token.value == '}' && token.type == 'symbol')){
                    token = tokens[++current];
                }
                // if(!token) debugger;
                
            }

            current++;
            return node;
        }

        if (token.value === '(' && token.type == 'symbol') {
            token = tokens[++current];
            // let prevToken = tokens[current - 2];
            // if (typeof(prevToken) != 'undefined' && prevToken.type === 'name') {
            var node = {
                type: 'CodeCave',
                // name: prevToken.value,
                params: []
            };
            while (!(token.value == ')' && token.type == 'symbol')) {
                node.params.push(walk());
                token = tokens[current];
            }
            //? check if this is paramerterlist
            //TODO: this might wrong when in "if". eg: if (v < VCPU_VERSION || v > 65535)
            if (node.params.length >= 2 && node.params[1].type != 'comma') {
                // node = {
                //     type: 'Parameters',
                //     params: tokens2parameters(node.params)
                // }
                node.type = 'Parameters'
            }

            current++;
            return node;
        }
        // Handle function calls
        // if (token.type === 'identifier' && tokens[current + 1]?.value === '(') {
        //     const name = token.value;
        //     current += 2; // Skip identifier and '('
        //     const args = [];
        //     while (tokens[current].value !== ')') {
        //         args.push(walk());
        //         current++;
        //     }
        //     current++; // Skip ')'
        //     return {
        //         type: 'FunctionCall',
        //         name,
        //         arguments: args,
        //     };
        // }

        if (token.type == 'semi') {
            current++;
            return {
                type: 'Terminator', value: token.value
            }
        }
        if (token.type == 'keyword') {
            current++;
            return {
                type: 'Keyword', name: token.value
            }
        }
        // if(token.type=='comma'){
        //     current++;
        //     return {
        //         type: 'Separator', value: token.value
        //     }
        // }

        if (['symbol', 'guid', 'comma'].includes(token.type)) {
            current++;
            return token
            // return {
            //     // type: 'Symbol', value: token.value
            //     ...token, //type: token.type
            // }
        }

        //throw new TypeError(`Unknown token: ${token.type}`);
        console.log(`Parser: Unknown token: ${JSON.stringify(token)}`);
        current++;
    }

    const ast = {
        type: 'Program',
        body: [],
    };

    while (current < tokens.length) {
        const node = walk();
        if (node !== null) { // Skip preprocessor directives, commas, and semicolons
            ast.body.push(node);
        }
    }

    return ast;
}

function parseStatement(tokens){
    //* it is because we need to take care a statement differently than
    //* syntax in root.
    const BINARY_OPERATORS = ["+", "-", "*", "/", "%", "|", "&", "^", "==", "!=", "<", ">", "<=", ">="]
    const ASSIGNMENT_OPERATORS = ["+=", "=", "-=", "*=", "/=", "%="];
    let current = 0;
    const body = [];


    function nextis(type, i = 1) {
        let token = tokens[current + i]
        return token && token.type == type
    }

    function walk() {
        let token = tokens[current]; let value;

        if(!token){
            debugger
        }

        if (token.type === 'identifier' && nextis('identifier')) {
            //* ie. `int sum ...`
            const varType = token.name || token.value;
            token = tokens[++current]
            current++;
            return {
                type: 'LocalVar',
                varType,
                name: token.name || token.value
            }; 
        }
        
       
        if (token.type == 'symbol' && BINARY_OPERATORS.includes(token.value)) {
            const left = body.pop()
            const operator = token.value;
            current++;
            const right = walk()
            // current++;
            // token = tokens[++current]
            return {
                type: 'BinaryExpression',
                left,
                operator,
                right
            }; 
        }
        // if (token.type === 'identifier' && BINARY_OPERATORS.includes(next())) {
        //     const left = token
        //     token = tokens[++current]
        //     const operator = token.value;
        //     // current++;
        //     const right = walk()
        //     // current++;
        //     // token = tokens[++current]
        //     return {
        //         type: 'BinaryExpression',
        //         left,
        //         operator,
        //         right
        //     }; 
        // }

        // if (token.type === 'Keyword' && token.name == 'return') {
        //     token = tokens[++current]
        //     current++;
        //     return {
        //         type: 'Return',
        //         value: token,
        //     }; 
        // }

        current++;
        return token

    }

    //? 1st pass: binary
    while (current < tokens.length) {
        const node = walk();
        if (node !== null) { // Skip preprocessor directives, commas, and semicolons
            body.push(node);
        }
    }

    //? 2nd pass: DotTail
    //TODO: join al "MemberExpression" into "DotTail", maybe before binary
    for(current = 0; current < body.length; current++){
        function bodyNextis(type, i = 1) {
            let token = body[current + i]
            return token && token.type == type
        }
        // let token = body[current];
        while(bodyNextis('MemberExpression')){
            const [left, right] = body.splice(current, 2)
            const el = left.type == 'DotTail'? left : {
                type: 'DotTail',
                body: [left]
            }
            el.body.push(right.value)
            body.splice(current, 0, el);
            // debugger
            // current++;
        }
    }

    //? 3rd pass: assignment
    for(current = body.length -1; current >= 0; current--){
        let token = body[current];
         if (token.type == 'symbol' && ASSIGNMENT_OPERATORS.includes(token.value)) {
            const [left, _, right] = body.splice(current -1, 3)
            // const left = body.pop()
            const operator = _.value;
            // current++;
            // const right = walk()
            // current++;
            // token = tokens[++current]
            body.splice(current -1, 0, {
                type: 'Assignment',
                left,
                operator,
                right
            }) 
            current--;
        }
    }


    return body;

}

function tokens2parameters(tokens) {
    // console.log('tokens2args >', tokens)
    let result = [];
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type != "comma" && tokens[i + 1]?.type === "identifier") {
            result.push({
                type: "Parameter",
                varType: tokens[i].name,
                name: tokens[i + 1].name
            });
            i++; // Lewati identifier karena sudah diproses
        }
    }
    // console.log('tokens2args <', result)
    return result;
}
// So we define a traverser function which accepts an AST and a
// visitor. Inside we're going to define two functions...
function traverser(ast, visitor) {

    // A `traverseArray` function that will allow us to iterate over an array and
    // call the next function that we will define: `traverseNode`.
    function traverseArray(array, parent) {
        if(!Array.isArray(array)){
            debugger
        }
        array.forEach(child => {
            traverseNode(child, parent);
        });
    }

    function traverseBackArray(array, parent) {
        //? 
        array.slice().reverse().forEach(child => {
            traverseNode(child, parent);
        });
    }

    // `traverseNode` will accept a `node` and its `parent` node. So that it can
    // pass both to our visitor methods.
    function traverseNode(node, parent) {
        if(!node || !node.type) debugger;

        // We start by testing for the existence of a method on the visitor with a
        // matching `type`.
        let methods = visitor[node.type];

        // If there is an `enter` method for this node type we'll call it with the
        // `node` and its `parent`.
        if (methods && methods.enter) {
            methods.enter(node, parent);
        }

        // Next we are going to split things up by the current node type.
        switch (node.type) {

            // We'll start with our top level `Program`. Since Program nodes have a
            // property named body that has an array of nodes, we will call
            // `traverseArray` to traverse down into them.
            //
            // (Remember that `traverseArray` will in turn call `traverseNode` so  we
            // are causing the tree to be traversed recursively)
            case 'Program':
            case 'IfDefined':
            case 'ExpressionStatement':
            case 'ElseExpression':
                traverseArray(node.body, node);
                break;

            case 'IfExpression':
                traverseNode(node.expect, node);
                methods.neck(node, parent); //? JUMPIF
                traverseArray(node.body, node);
                break;

            case 'FunctionDeclaration':
                traverseBackArray(node.parameters, node);
                methods.stackProtection(node, parent); //? Code injection
                
                traverseArray(node.body, node);
                break;

            case 'BinaryExpression':
            case 'Assignment':
                traverseNode(node.left, node);
                traverseNode(node.right, node);
                break;

            case 'UnaryExpr':
            case 'NotExpression':
                traverseNode(node.value, node);
                break;

            // Next we do the same with `CallExpression` and traverse their `params`.
            case 'CallExpression':
                traverseBackArray(node.arguments, node);
                break;

            // In the cases of `NumberLiteral` and `StringLiteral` we don't have any
            // child nodes to visit, so we'll just break.
            case 'NumberLiteral':
            case 'StringLiteral':
            case 'Parameter':
            case 'macro':
                break;

            // And again, if we haven't recognized the node type then we'll throw an
            // error.
            // default:
            //     // throw new TypeError(node.type);
            //     console.log('untransformed',node.type, node)
        }

        // If there is an `exit` method for this node type we'll call it with the
        // `node` and its `parent`.
        if (methods && methods.exit) {
            methods.exit(node, parent);
        }
    }

    // Finally we kickstart the traverser by calling `traverseNode` with our ast
    // with no `parent` because the top level of the AST doesn't have a parent.
    traverseNode(ast, null);
}


// So we have our transformer function which will accept the lisp ast.
function transformer(ast) {

    // We'll create a `newAst` which like our previous AST will have a program
    // node.
    let newAst = {
        type: 'Program',
        stackprot: false, //? it maybe changed in between
        verChecked: false,//? indicate that __deprecated_runtime has been validated
        userfuncs: [],  //? user-functions. will be anonymous-function
        procedures: [], //? byte code of function (userfunc + events)
        methods: [],    //? api-functions; name is visible in maki
        bindings: [],
        strings: [],    //? string for default value
        registry: [],
        variables: [],  //? final varaibles, used by VM
        defined: [],    //? temporary variables, used by compiler
        body: [],
        externals: [],  //? holds api-function extracted from *.mi files
        binary: [],
    };

    // Next I'm going to cheat a little and create a bit of a hack. We're going to
    // use a property named `context` on our parent nodes that we're going to push
    // nodes to their parent's `context`. Normally you would have a better
    // abstraction than this, but for our purposes this keeps things simple.
    //
    // Just take note that the context is a reference *from* the old ast *to* the
    // new ast.
    ast.binary = newAst.binary;
    ast._context = newAst.body;
    ast._registry = newAst.registry;
    ast._methods = newAst.methods;
    ast._userfuncs = newAst.userfuncs;
    ast._defined = newAst.defined;
    ast._variables = newAst.variables;
    ast._bindings = newAst.bindings;
    ast._externals = newAst.externals;
    ast._procedures = newAst.procedures;
    ast._strings = newAst.strings;

    let theFun = null; // current proc
    let ifStacks = []; // for resolving the JUMPIF number of if.body.length

    // const irSolver = (node) => {
    //     let offset;

    //     switch (node.type) {
    //         case 'identifier':
    //         case 'LocalVar':
    //         case 'NumberLiteral':
    //             if(node.name in theFun.vars){
    //                 offset = theFun.vars[node.name].offset
    //             } else {
    //                 theFun.vars[node.name] = node;
    //                 ast._variables.push({
    //                     name: node.name,
    //                     node: node,
    //                 })
    //                 offset = ast._variables.length -1;
    //                 node.offset = offset
    //             }
    //             return `${offset}  ${JSON.stringify(node).replace(/"/gm,"'")} `
    //             break;

    //         case 'CallExpression':
    //             break;

    //         case '*':
    //             break;

    //         default:
    //             break;
    //     }
    // }

    let irByteLen = 0;
    function irFun(opcodes){
        let write = false;
        let num = 0;
        if(!opcodes.startsWith(';') && !opcodes.startsWith('//')){
            const opcode = opcodes.split(' ')[0]
            const spec = OPCODES[opcode]
            if(!spec){
                throw new Error(`Invalid opcode :"${opcode}" in ${opcode}`);
            }
            num = Number(spec.bytes)
            write = true;
        }
        // theFun.ir.push(opcodes)
        // theFun.ir.push(`${num}  ${opcodes}`)
        theFun.ir.push(`${opcodes}  _${num} #${irByteLen}`)
        irByteLen += num;
    }

    function setVariable(variable){
        const node ={
            ...variable,
            type: variable.varType || variable.type,
            NAME: variable.name.toUpperCase(),
            isUsed: true,
            offset:  ast._variables.length,
        }
        if(node.type=='number' || node.type=='NumberLiteral'){
            if(node.value.includes('.'))
                node.type = 'float'
            else
                node.type = 'int'
        }
        ast._variables.push(node)
        // node.offset = ast._variables.length -1;
        return node
    }


    function regString(node) {
        if(node.type.toLowerCase() != 'string' || node.value == undefined) 
            return;
        let theStr = ast._strings.find(s => s.value == node.value)
        if(!theStr){
            ast._strings.push(node)   //? actually only need: {value, offset}
            // theVar && setVariable(theVar)
        }
        return theStr
    }

    
    function getVariable(node) {
        let theVar = theFun.vars[node.name] //? what is this?
        if(!theVar){
            // if(!varName) debugger;
            theVar = ast._variables.find(v => v.NAME == (node.name || '').toUpperCase())
        }
        if(!theVar) { 
            switch (node.type) {
                case "NumberLiteral":
                    if(node.value.includes('.'))
                        node.type = 'float'
                    else
                        node.type = 'int';
                    theVar = ast._variables.find(v => v.literal && v.type == node.type &&  v.value == node.value)
                    if(!theVar){
                        theVar = setVariable({...node, name:`#${node.value}`, literal:true})
                    }
                    break;
            
                case "StringLiteral":
                    theVar = ast._variables.find(v => v.literal && v.type == 'string' &&  v.value === node.value)
                    if(!theVar){
                        theVar = setVariable({...node, type: 'string', name:`#${node.value}`, literal:true})
                        // ast._strings.push({value: node.value, offset: theVar.offset}) 
                        regString(theVar)
                    }
                    break;
            
                case "LocalVar":
                    const classIndex = ast._registry.findIndex(reg=> reg.ALIAS == node.varType.toUpperCase())
                    //? force add
                    theVar = setVariable({...node, //type: node.varType,
                        isObject: classIndex >= 0,
                        classIndex,
                    })
                    break;
                    
                case "Parameter":
                case "identifier":
                    // if(node.name=='MC_TARGET') debugger
                    const varName = node.name;
                    if(!theVar){
                        theVar = ast._registry.find(cls => cls.ALIAS == varName.toUpperCase())
                        theVar && (theVar = setVariable(theVar))
                    }
                    if(!theVar){
                        theVar = ast._defined.find(cls => cls.NAME == varName.toUpperCase())
                        if(theVar){
                            theVar.type = theVar.value? theVar.value.type : null;
                            theVar.value = theVar.value? theVar.value.value: null;
                            theVar = setVariable(theVar)
                        }
                    }
                    if(!theVar){
                        theVar = setVariable({...node, })
                    }
                    regString(theVar)
                    break;
            }  
        }

        return theVar
    }
    function getVariable0(varName, props) {
        //? special: the null
        if(!varName && props.value === 'null' && props.type=='identifier') {
            varName == 'NULL'
        }
        let theVar = theFun.vars[varName]
        if(!theVar && props &&  props.type == "NumberLiteral"){
            theVar = ast._variables.find(v => v.literal && /* v.type == props.type &&  */v.value == varName)
            if(!theVar){
                theVar = setVariable({...props, name:`#${varName}`, literal:true})
            }
            // theVar && setVariable(theVar)
        }
        if(!theVar){
            if(!varName) debugger;
            theVar = ast._variables.find(v => v.NAME == varName.toUpperCase())
            // theVar && setVariable(theVar)
        }
        if(!theVar){
            theVar = ast._registry.find(cls => cls.ALIAS == varName.toUpperCase())
            theVar && setVariable(theVar)
        }
        if(!theVar){
            theVar = ast._defined.find(cls => cls.NAME == varName.toUpperCase())
            if(theVar){
                theVar.type = theVar.value? theVar.value.type : null;
                theVar.value = theVar.value? theVar.value.value: null;
                setVariable(theVar)
            }
        }
        if(!theVar){
            theVar = setVariable({name:`$${varName}`, ...props, })
        }
        // if(theVar.type=='number' || theVar.type=='NumberLiteral'){
        //     if(theVar.value.includes('.'))
        //         theVar.type = 'int'
        //     else
        //         theVar.type = 'float'
        // }
        return theVar
    }

    function getString(strVal) {
        let theStr = ast._strings.find(s => s.value == strVal)
        if(!theStr){
            const name = `"${strVal}"`
            setVariable({name, value: strVal, type:'string'});    //? let it be processed as a valid var
            theStr = getVariable(name);       //? the valid var
            ast._strings.push(theStr)   //? actually only need: {value, offset}
            // theVar && setVariable(theVar)
        }
        return theStr
    }

    function getMethod(methodName, className='', save2methods=true) {
        //? called by CallExpression.exit()
        const METHODNAME = methodName.toUpperCase()
        const CLASSNAME = className.toUpperCase()
        let method = ast._methods.find(m => m.NAME == METHODNAME & m.CLASSNAME==CLASSNAME)
        if(!method){ 
            method = ast._userfuncs.find(uf => uf.NAME == METHODNAME)
        }
        if(!method){
            method = ast._externals.find(m => m.NAME == METHODNAME & m.CLASSNAME==CLASSNAME)
            if(method){
                method.offset = ast._methods.length
                method.classOffset = ast._registry.findIndex(reg => reg.ALIAS == CLASSNAME)
                save2methods && ast._methods.push(method)
            }
            else {
                const variable = ast._variables.find(v => v.NAME == CLASSNAME)
                if(variable){
                    className = variable.type;
                    method = getMethod(methodName, className, save2methods)
                }
            }
        }
        if(!method){ //! TEMPORARY
            method = ast._externals.find(m => m.NAME == METHODNAME /* & m.CLASSNAME==CLASSNAME */)
            if(method){
                method.offset = ast._methods.length
                method.classOffset = ast._registry.findIndex(reg => reg.ALIAS == CLASSNAME)
                save2methods && ast._methods.push(method)
            }
        }
        return method
    }
    // We'll start by calling the traverser function with our ast and a visitor.
    traverser(ast, {

        Program: {
            enter(node, parent) {
                node.binary.push('FG')
                node.binary.push(3,4,23,0,0)
            },
        },

        Predecl: {
            enter(node, parent) {
                if(node.name == '.STACKPROT'){
                    newAst.stackprot = true;
                }
                if(node.name == '.CODE'){
                    ast._variables.push({
                        isGlobal: true,
                        type: 'System',
                        name: 'System',
                        NAME: 'SYSTEM',
                        isObject: 1,
                        classIndex: 1,
                        predeclared: true, // https://en.wikipedia.org/wiki/Predeclared
                        isUsed: 1,
                        offset: 0,
                    });
                    ast._variables.push({
                        isGlobal: true,
                        name: 'NULL',
                        NAME: 'NULL',
                        type: 'int',
                        isObject: 0,
                        isUsed: 1,
                        offset: 1,
                    });
                    ast._variables.push({
                        isGlobal: true,
                        name: '__deprecated_runtime',
                        NAME: '__DEPRECATED_RUNTIME',
                        type: 'int',
                        isObject: 0,
                        isUsed: 1,
                        offset: 2,
                    });
                }
            },
        },

        IfDefined: {
            enter(node, parent) {
                const name = node.expect
                const exists = ast._defined.find(v => v.name == name)
                if(node.ifdef && !exists){
                    node.body = []
                }
                if(!node.ifdef && exists){
                    node.body = []
                }
            }
        },
        Define: {
            enter(node, parent) {
                ast._defined.push({
                    name: node.name,
                    NAME: node.name.toUpperCase(),
                    // isGlobal: true,
                    isObject: 0,
                    value: node.value,
                    // type: node.type,
                    isUsed: false, //? not yet, set true by opcode/assembler
                });
            }
        },
        Instanciate: {
            enter(node, parent) {
                const NAME = node.target.value.toUpperCase()
                const cls = ast._registry.find(reg => reg.ALIAS == NAME)
                irFun(`NEW ${cls.offset} Instanciate`)
            }
        },

        GlobalDeclaration: {
            enter(node, parent) {
                node.declarations.forEach(d =>{
                    const classIndex = ast._registry.findIndex(reg=> reg.ALIAS == node.varType.toUpperCase())
                    setVariable({
                        ...node,
                        isObject: classIndex >= 0,
                        classIndex,
                        name: d.value,
                        isGlobal: true,
                        isUsed: true, //? signal for global = always included in .maki
                    })
                    // ast._variables.push({
                    //     isGlobal: true,
                    //     type: node.varType,
                    //     name: d.value,
                    //     NAME: d.value.toUpperCase(),
                    //     isUsed: true, //? signal for global = always included in .maki
                    // });
                })
            },
        },

        // The first visitor method accepts any `NumberLiteral`
        LocalVar: {
            // We'll visit them on enter.
            enter(node, parent) {
                const v = getVariable(node)
                // let offset
                // // debugger
                // if(node.name in theFun.vars){
                //     offset = theFun.vars[node.name].offset
                // } else {
                //     theFun.vars[node.name] = node;
                //     // ast._variables.push({
                //     //     ...node,
                //     //     // name: node.name,
                //     //     NAME: node.name.toUpperCase(),
                //     //     // node: node,
                //     //     type: node.varType || node.type,
                //     //     isUsed: true,
                //     // })
                //     // offset = ast._variables.length -1;
                    
                    
                //     const classIndex = ast._registry.findIndex(reg=> reg.ALIAS == node.varType.toUpperCase())
                //     const node2 = setVariable({
                //         ...node,
                //         isObject: classIndex >= 0,
                //         classIndex,
                //         name: node.name,
                //         isGlobal: false,
                //         isUsed: true, //? signal for global = always included in .maki
                //     })
                //     // node.offset = node2.offset
                //     // offset = node.offset
                //     offset = node2.offset
                // }
                // return `${offset}  ${JSON.stringify(node).replace(/"/gm,"'")} `
                // irFun(`PUSH ${offset} LOCALVAR`)
                irFun(`PUSH ${v.offset} LOCALVAR`)
            },
        },

        NumberLiteral: {
            // We'll visit them on enter.
            enter(node, parent) {
                const v = getVariable(node)
                // debugger
                theFun && irFun(`PUSH ${v.offset} ${v.value}`)

                // We'll create a new node also named `NumberLiteral` that we will push to
                // the parent context.
                // parent._context.push({
                //     type: 'NumberLiteral',
                //     value: node.value,
                // });
            },
        },
        identifier: {
            enter(node, parent) {
                if(theFun){
                    const v = getVariable(node)
                    // debugger
                    theFun && irFun(`PUSH ${v.offset} ${v.name}`)
                }
            }
        },

        // Next we have `StringLiteral`
        StringLiteral: {
            enter(node, parent) {
                // const s = getString(node.value)
                const s = getVariable(node)
                // debugger
                theFun && irFun(`PUSH ${s.offset} ${s.name}`)
                // parent._context.push({
                //     type: 'StringLiteral',
                //     value: node.value,
                // });
            },
        },

        ClassRegistry: {
            enter(node, parent) {
                if(node.deprecated) return;
                const alias= node.data[node.data.length -1].name;
                ast._registry.push({
                    key: node.data[0].value,
                    alias,
                    ALIAS: alias.toUpperCase(),
                    offset: ast._registry.length,
                });
            },
        },

        ExternalMethod: {
            enter(node, parent) {
                // node.pop('type')
                const {type, name, ...method} = node
                const [className, methodName] = name.split('.')
            ast._externals.push({className, CLASSNAME: className.toUpperCase(), methodName, NAME: methodName.toUpperCase(), ...method});
            },
        },

        UserFunction_h: {
            enter(node, parent) {
                //? used later to detect wheter a funcDec is uf or not.
                ast._userfuncs.push({
                    // name:node.name, 
                    ...node,
                    NAME: node.name.toUpperCase() 
                });
            },
        },

        FunctionDeclaration: {
            enter(node, parent) {
                let uf = null;
                let [className, methodName] = node.name.split('.')
                if(!methodName) {
                    //? possibly Custom Function
                    methodName = node.name
                    let PROCNAME = methodName.toUpperCase()
                    uf = ast._userfuncs.find(proc => proc.NAME == PROCNAME)
                    if(uf){
                        //? correct method.name
                        methodName = uf.name
                    } 
                    //? possibly binding 
                    else {
                        className = 'System'
                    }
                } 

                if(!uf){
                    const method = getMethod(methodName, className)
                    node.methodIndex = method.offset
                    // let {className, methodName} = method;
                    // className = node.className= method.className;
                    methodName = node.methodName= method.methodName;
                    //? non user-function, has to register
                    const CLASSNAME = className.toUpperCase()
                    // let obj = ast._registry.find(cls => cls.ALIAS == CLASSNAME)
                    // const variable = ast._variables.find(v => v.NAME == CLASSNAME)
                    // // debugger
                    // node.variableIndex = ast._variables.indexOf(variable)
                    node.variableIndex = ast._variables.findIndex(v => v.NAME == CLASSNAME)
                    // if(obj == null){
                    //     obj = ast._registry.find(cls => cls.alias == variable.type)
                    // }
                    // let classIndex = ast._registry.indexOf(obj)
                    // debugger
                    node.classOffset = method.classOffset
                    // node.methodIndex = ast._methods.length;
                    //? method
                    // ast._methods.push({
                    //     classIndex,
                    //     classOffset: classIndex,
                    //     string: methodName,
                    // });
                    
                    //let say commands has been generated
                    // //? binding
                    // ast._bindings.push({
                    //     variableIndex,
                    //     methodIndex: ast._methods.length -1,
                    //     binaryOffset: -1,
                    //     className, methodName, 
                    //     // classIndex,
                    // });
                }
                node.uf = uf != null

                //? set container of bytecodes
                const fun = {
                    name: node.name,
                    NAME: node.name.toUpperCase(),
                    ir: [],
                    bytes: [],
                    vars: {},
                    start: irByteLen
                }
                
                //? register by first visible in program
                ast._procedures.push(fun);   

                //? global 
                theFun = fun

                //TODO: Assembler here
            },


            stackProtection(node, parent) {
                //? Note: it's for winamp 5.x, it may differ for Winamp 3.x

                if(node.uf) //? all apiCall only, ignore UserDefinedFunction
                    return;
                if(node.name.toLowerCase() == 'system.onscriptloaded'){
                    // const code = 'if(not(versionCheck())) return null;'
                    const code = 'ifnot(versionCheck()) return null;'
                    const wrapperAst = code2ast(code)[0]
                    node.body.splice(0,0,wrapperAst);
                    newAst.verChecked = true;
                } else {
                    if(newAst.verChecked) {
                        const code = 'if(__deprecated_runtime) return null;'
                        const wrapperAst = code2ast(code)[0]
                        node.body.splice(0,0,wrapperAst);
                        newAst.verChecked = true;    
                    }
                }
            },


            exit(node, parent) {
                if(!node.uf){
                    //? binding. set it after assembler, as shown in usual maki's methods order
                    const {className, methodName, variableIndex, methodIndex, name} = node;
                    ast._bindings.push({
                        name,
                        variableIndex,
                        methodIndex,
                        binaryOffset: theFun.start,
                        className, 
                        methodName, 
                        // classIndex,
                    });
                }
                //? in binary it always happen, so let be identical first. optimized later
                irFun(`PUSH 1`)
                irFun(`RET `)
                theFun.end=  irByteLen;
                theFun = null;
            }
        },

        IfExpression: {
            enter(node, parent) {
                // debugger
                // console.log('if:', node.expect)
                // const ir = generateIR(node.expect, irSolver)
                // irFun(...ir)
                // console.warn('if:', ir)
                irFun(`; //IF () `)
            },
            
            neck(node,parent){
                const pos= theFun.ir.length;
                irFun(`JUMPIF <later.num> `)
                ifStacks.push({pos, start:irByteLen})
                // irFun(`<later.num> `)
            },
            exit(node,parent){
                // irFun(`//eof.IF () `)
                const mark = ifStacks.pop()
                const finish = irByteLen - mark.start 
                // debugger
                theFun.ir[mark.pos] = node.ifnot?  `JUMPIFNOT ${finish} `: `JUMPIF ${finish} `;
            }
        },

        ExpressionStatement:{
            // enter(node, parent) {
            //     // irFun(`//IF () `)
            //     const pos= theFun.ir.length;
            //     ifStacks.push({pos, start:irByteLen})
            // },
            
            exit(node,parent){
                // irFun(`;`)
                // const mark = ifStacks.pop()
                // const finish = irByteLen - mark.start 
                // debugger
                const lastIr = theFun.ir[theFun.ir.length -1]
                if(!lastIr.startsWith('RET ') && !lastIr.startsWith(';')){
                    // irFun(`POP  //; ${JSON.stringify(node)} `)
                    irFun('POP')
                }
                theFun.ir.push(';')
            }
        },

        BinaryExpression:{
            exit(node,parent){
                const opMap = {
                    "+": "ADD", "-": "SUB",
                    "*": "MUL", "/": "DIV", "%": "MOD",
                    "<": "LT", "<=": "LTE", ">": "GT", ">=": "GTE",
                    "==": "EQ", "!=": "NEQ",
                    "&&": "LOGAND", "||": "LOGOR"
                };
                irFun(opMap[node.operator])
            }
        },

        UnaryExpr: {
            exit(node,parent){
                const opMap = {
                    "!": "NOT", 
                    "-": "NEGATIVE",
                };
                irFun(opMap[node.operator])
            }
        },
        NotExpression: {
            exit(node,parent){
                irFun('NOT')
            }
        },

        Parameter: {
            enter(node, parent) {
                // irFun(`POPTO ${node.name}`)
                // debugger
                const variable = getVariable(node)
                irFun(`POPTO ${variable.offset}`)
            }
        },

        Return: {
            enter(node, parent) {
                // let variable = getVariable(node.value.value || node.value.name, node.value)
                const variable = getVariable(node.value)
                irFun(`PUSH ${variable.offset}`)
                irFun(`RET //${node.value.value}`)
            }
        },

        Assignment: {
            exit(node, parent) {
                // irFun(`MOV  @${node.operator}`)
                irFun(`MOV`)
            }
        },


        // Next up, `CallExpression`.
        CallExpression: {
            //? IR = class.varOffset, ...paramN.varOffset, APICALL|CALL, method.offset
            enter(node, parent) {
                let uf = null;
                let [className, methodName] = node.name.split('.')
                if(!methodName) {
                    //? possibly Custom Function
                    methodName = node.name
                    let PROCNAME = methodName.toUpperCase()
                    uf = ast._userfuncs.find(proc => proc.NAME == PROCNAME)
                    if(uf){
                        //? correct method.name
                        methodName = uf.name
                    } 
                    //? possibly binding 
                    else {
                        className = 'System'
                    }
                } 
                node.className = className
                node.methodName = methodName
                node.uf = uf!=null;

                //? fixup arguments.type as in func.declaration
                const method = getMethod(methodName, className, false);
                if(!method || !method.arguments) debugger
                // console.log(`--calling @${node.name}`, method)
                method.arguments.forEach((parameter,i) => {
                    const arg = node.arguments[i]
                    // debugger
                    arg.legalType = parameter.name;
                    // switch (arg.type) {
                    //     case 'identifier':
                    //     case 'NumberLiteral':
                    //     case 'StringLiteral':
                    //         getVariable(arg)
                    //         break;

                    //     case 'CallExpression':
                    //         // getMethod(arg.name);
                    //         break;
                    // }
                    // if(['NumberLiteral', 'StringLiteral', 'identifier'].includes(arg.type)){
                    //     getVariable(arg)
                    // }
                })
                //? after callExpr in params are validated, now this callExpr it self are regeistered to 
                // getMethod(methodName, className, true);

                if(uf){
                    const proc = ast._procedures.find(p => p.NAME = node.name.toUpperCase())
                    const offset = proc.start - irByteLen - 5
                    irFun(`USERFUNCCALL ${offset} ${node.name}`)
                } else {

                    //? non user-function, find class.varOffset
                    let variable = getVariable({type:'identifier', name:className})
                    if(!variable || variable.offset==null){
                        debugger
                    }
                    irFun(`PUSH ${variable.offset} CALL.INSTANCE`)  //? the instance
                }
            },

            exit(node, parent){

                if(!node.uf){
                    const {methodName, className} = node
                    let method = getMethod(methodName, className)
                    if(!method || method.offset==null){
                        debugger
                        // variable =
                    }
                    // irFun(`APICALL ${method.offset}  ${methodName} `)  //? the instance
                    const opcode = newAst.stackprot? 'STRANGECALL' : 'APICALL'
                    irFun(`${opcode} ${method.offset}  ${methodName} `)  //? the instance
                    
                    // let obj = ast._registry.find(cls => cls.ALIAS == CLASSNAME)
                    // if(obj == null){
                    //     obj = ast._registry.find(cls => cls.alias == variable.type)
                    // }
                    // let classIndex = ast._registry.indexOf(obj)
                    // //? method
                    // ast._methods.push({
                    //     classIndex,
                    //     string: methodName,
                    // });
                    
                    //let say commands has been generated
                    // //? binding
                    // ast._bindings.push({
                    //     variableIndex,
                    //     methodIndex: ast._methods.length -1,
                    //     binaryOffset: -1,
                    //     className, methodName, 
                    //     // classIndex,
                    // });
                }

                // // We start creating a new node `CallExpression` with a nested
                // // `Identifier`.
                // let expression = {
                //     type: 'CallExpression',
                //     callee: {
                //         type: 'Identifier',
                //         name: node.name,
                //     },
                //     arguments: [],
                // };

                // // Next we're going to define a new context on the original
                // // `CallExpression` node that will reference the `expression`'s arguments
                // // so that we can push arguments.
                // node._context = expression.arguments;

                // // Then we're going to check if the parent node is a `CallExpression`.
                // // If it is not...
                // if (parent.type !== 'CallExpression') {

                //     // We're going to wrap our `CallExpression` node with an
                //     // `ExpressionStatement`. We do this because the top level
                //     // `CallExpression` in JavaScript are actually statements.
                //     expression = {
                //         type: 'ExpressionStatement',
                //         expression: expression,
                //     };
                // }

                // Last, we push our (possibly wrapped) `CallExpression` to the `parent`'s
                // `context`.
                // ast._context.push(expression);
            },
        }
    });

    // At the end of our transformer function we'll return the new ast that we
    // just created.
    return newAst;
}


function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function code2statement(code){
    const tokens = tokenizer(code);
    const ast = parseStatement(tokens.filter(tk => tk !=null & tk.type != 'comment'));
    // const ast2 = transformer(ast);
    return ast
}

function code2ast(code){
    const tokens = tokenizer(code);
    const ast = parser(tokens.filter(tk => tk !=null & tk.type != 'comment'));
    // const ast2 = transformer(ast);
    return ast.body
}


export {
    hideComments,
    tokenizer,
    parser,
    transformer,

    code2ast,
    code2statement,
}