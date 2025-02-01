function isa(token, type){
    return token && token.type == type
}

// Tokenizer
function tokenizer(input) {
    const tokens = [];
    let current = 0;

    const WHITESPACE = /\s/;
    const NUMBERS = /[0-9]/;
    const LETTERS = /[a-z_]/i;
    const GUID = /[0-9\-a-z]/i;

    while (current < input.length) {
        let char = input[current];

        // Skip whitespace
        if (WHITESPACE.test(char)) {
            current++;
            continue;
        }

        if (char === '/' && input[current+1] == '/') {
            let value = char;
            char = input[++current];
            while (char !== '\n' && current < input.length) {
                value += char;
                char = input[++current];
            }
            tokens.push({ type: 'comment', 
                // value: value.trim() 
            });
            continue;
        }

        if (char === '/' && input[current+1] == '*') {
            current++
            current++
            let value = '/*';
            char = input[current++];
            value += char;
            let lastChar = null;
            while ( !(char == '/' && lastChar=='*' ) && current < input.length) {
                lastChar = char;
                char = input[current++];
                value += char;
            }
            tokens.push({ type: 'comment', 
                // value: value.trim() 
            });
            // console.log(value)
            continue;
        }

        if (char === '@' && input[current+1] == '{') {
            current++
            current++
            let value = '';
            char = input[current++];
            while (GUID.test(char)) {
                value += char;
                char = input[++current];
            }
            current++
            current++
            tokens.push({ type: 'guid', 
                value: value.trim() 
            });
            continue;
        }

        // Handle preprocessor directives (e.g., #include)
        if (char === '#') {
            let name = '';
            char = input[++current];
            while ((LETTERS.test(char) || NUMBERS.test(char)) && current < input.length ) {
                name += char;
                char = input[++current];
            }
            if(name=='endif'){
                debugger
            }
            let value = '';
            char = input[current];
            while (char !== '\n' && current < input.length) {
                value += char;
                char = input[++current];
            }
            // tokens.push({ type: 'preprocessor', value: value.trim() });
            const data = tokenizer(value.trim())
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
            while ((LETTERS.test(char) || NUMBERS.test(char)) && current < input.length ) {
                value += char;
                char = input[++current];
            }

            // Check if it's a keyword or type
            if (
                value === 'Global' || value === 'Function' || //value === 'System' || 
                value === 'int' || value === 'return' || 
                value === 'class' || 
                value === 'extern' 
            ) {
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
        if(char === ',') {
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
    }

    return tokens;
}
// Parser
function parser(tokens) {
    let current = 0;

    function nextis(type, i=0){
        let token = tokens[current+i]
        return token && token.type == type
    }
    function next(i=0){
        let token = tokens[current+i]
        return token.value || ''
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
            if(token.name == 'ifdef' || token.name == 'ifndef'){
                //? such as #ifndef __STD_MI is crucial, it may take|ignore whole file
                const block = [];
                while (!(tokens[current].type == 'macro' && tokens[current].name == 'endif')) {
                    // data.push(tokens[current]);
                    block.push(walk());
                    // current++;
                }
                current++;
                return {
                    type: 'Ifdef',
                    name: token.name,
                    data: token.data,
                    codeDomain: block
                }
            }
            return token
            return null; // Skip preprocessor directives
        }

        //* .CODE  | .STACKPROT
        if (token.type === 'dot' && next().toUpperCase() == next()) {
            current++;
            token = tokens[current++];
            return {
                type: 'macro',
                name: token.value,
            }
        }
        
        if (token.value === 'extern' ) {
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
                type: 'Registry',
                varType:token,
                data,
            };
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

        // Handle identifiers
        if (token.type === 'identifier') {
            value = token.value;
            current++
            if(nextis('dot') && nextis('identifier', 1)){
                token = tokens[current++];
                value+= token.value;
                token = tokens[current++];
                value+= token.value;
            }
            const node = {
                type: 'Identifier',
                name: value,
            };
            if(next()=='('){    //? it maybe a FuncDec or a Call
                node.type = "CallExpression"
                const params = walk();

                if(next()=='{'){
                    node.type = "FunctionDeclaration"
                    node.parameters = params.params
                    node.body = walk().body; //? codeDomain
                } else {
                    node.arguments = params.params
                }
                // current++
                // return {
                //     type: 'FunctionDeclaration',
                //     name: value,
                //     params,
                // };
            }
            return node
        }

        // Handle types (e.g., int)
        if (token.type === 'keyword' && token.value === 'int') {
            current++;
            return {
                type: 'Type',
                name: 'int',
            };
        }

        // Handle assignment (=)
        if (token.type === 'assignment') {
            current++;
            const left = walk(); // Get the variable name
            const right = walk(); // Get the assigned value
            return {
                type: 'Assignment',
                left,
                right,
            };
        }

        // Handle dots (.)
        if (token.type === 'dot') {
            current++;
            const object = walk(); // Get the object
            const property = walk(); // Get the property or method
            return {
                type: 'MemberExpression',
                object,
                property,
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
            token = tokens[++current]; // Skip 'Function'
            const name = token.value;

            token = tokens[++current]; // Skip '('
            // const params = [];
            const params = walk();
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

            return {
                type: 'CustomFunctionHeader',
                name,
                params,
                // body,
            };
        }

        // Handle global declarations
        if (token.type === 'keyword' && token.value === 'Global') {
            current++;
            const varType = tokens[current++].value;
            // debugger
            const declarations = [];
            let last = null
            while (tokens[current].value !== ';') {
                token = tokens[current++];
                if(token.type=='identifier'){
                    declarations.push(token);
                } else if(token.value==','){
                    continue // Skip commas
                } else if(token.value=='='){
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

        if (token.value === '{' && token.type == 'symbol' ) {
            token = tokens[++current];
            // let prevToken = tokens[current - 2];
            // if (typeof(prevToken) != 'undefined' && prevToken.type === 'name') {
            var node = {
                type: 'CodeDomain',
                // name: prevToken.value,
                body: []
            };
            while ( !(token.value == '}' && token.type == 'symbol') ) {
                node.body.push(walk());
                token = tokens[current];
            }
      
            current++;
            return node;
        }

        if (token.value === '(' && token.type == 'symbol' ) {
            token = tokens[++current];
            // let prevToken = tokens[current - 2];
            // if (typeof(prevToken) != 'undefined' && prevToken.type === 'name') {
            var node = {
                type: 'CodeCave',
                // name: prevToken.value,
                params: []
            };
            while ( !(token.value == ')' && token.type == 'symbol') ) {
                node.params.push(walk());
                token = tokens[current];
            }
            //? check if this is paramerterlist
            if(node.params.length>=2 && node.params[1].type != 'comma'){
                node = {
                    type: 'Parameters',
                    params: tokens2parameters(node.params)
                }
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

        if(token.type=='semi'){
            current++;
            return {
                type: 'Terminator',value: token.value
            }
        }
        if(token.type=='keyword'){
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

        if(['symbol','guid', 'comma'].includes(token.type)){
            current++;
            return token
            // return {
            //     // type: 'Symbol', value: token.value
            //     ...token, //type: token.type
            // }
        }

        //throw new TypeError(`Unknown token: ${token.type}`);
        console.log(`Unknown token: ${JSON.stringify(token)}`);
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

function tokens2parameters(tokens) {
    console.log('tokens2args >',tokens)
    let result = [];
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type === "Type" && tokens[i + 1]?.type === "Identifier") {
            result.push({
                type: "Parameter",
                varType: tokens[i].name,
                name: tokens[i + 1].name
            });
            i++; // Lewati identifier karena sudah diproses
        }
    }
    console.log('tokens2args <',result)
    return result;
}
// So we define a traverser function which accepts an AST and a
// visitor. Inside we're going to define two functions...
function traverser(ast, visitor) {

    // A `traverseArray` function that will allow us to iterate over an array and
    // call the next function that we will define: `traverseNode`.
    function traverseArray(array, parent) {
      array.forEach(child => {
        traverseNode(child, parent);
      });
    }
  
    // `traverseNode` will accept a `node` and its `parent` node. So that it can
    // pass both to our visitor methods.
    function traverseNode(node, parent) {
  
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
          traverseArray(node.body, node);
          break;
  
        // Next we do the same with `CallExpression` and traverse their `params`.
        case 'CallExpression':
          traverseArray(node.params, node);
          break;
  
        // In the cases of `NumberLiteral` and `StringLiteral` we don't have any
        // child nodes to visit, so we'll just break.
        case 'NumberLiteral':
        case 'StringLiteral':
          break;
  
        // And again, if we haven't recognized the node type then we'll throw an
        // error.
        default:
          throw new TypeError(node.type);
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
      body: [],
    };
  
    // Next I'm going to cheat a little and create a bit of a hack. We're going to
    // use a property named `context` on our parent nodes that we're going to push
    // nodes to their parent's `context`. Normally you would have a better
    // abstraction than this, but for our purposes this keeps things simple.
    //
    // Just take note that the context is a reference *from* the old ast *to* the
    // new ast.
    ast._context = newAst.body;
  
    // We'll start by calling the traverser function with our ast and a visitor.
    traverser(ast, {
  
      // The first visitor method accepts any `NumberLiteral`
      NumberLiteral: {
        // We'll visit them on enter.
        enter(node, parent) {
          // We'll create a new node also named `NumberLiteral` that we will push to
          // the parent context.
          parent._context.push({
            type: 'NumberLiteral',
            value: node.value,
          });
        },
      },
  
      // Next we have `StringLiteral`
      StringLiteral: {
        enter(node, parent) {
          parent._context.push({
            type: 'StringLiteral',
            value: node.value,
          });
        },
      },
  
      // Next up, `CallExpression`.
      CallExpression: {
        enter(node, parent) {
  
          // We start creating a new node `CallExpression` with a nested
          // `Identifier`.
          let expression = {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: node.name,
            },
            arguments: [],
          };
  
          // Next we're going to define a new context on the original
          // `CallExpression` node that will reference the `expression`'s arguments
          // so that we can push arguments.
          node._context = expression.arguments;
  
          // Then we're going to check if the parent node is a `CallExpression`.
          // If it is not...
          if (parent.type !== 'CallExpression') {
  
            // We're going to wrap our `CallExpression` node with an
            // `ExpressionStatement`. We do this because the top level
            // `CallExpression` in JavaScript are actually statements.
            expression = {
              type: 'ExpressionStatement',
              expression: expression,
            };
          }
  
          // Last, we push our (possibly wrapped) `CallExpression` to the `parent`'s
          // `context`.
          parent._context.push(expression);
        },
      }
    });
  
    // At the end of our transformer function we'll return the new ast that we
    // just created.
    return newAst;
}
  
  
  

export {
    tokenizer,
    parser,
    transformer,
}