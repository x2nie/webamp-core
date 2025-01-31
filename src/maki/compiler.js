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
            let value = '';
            char = input[++current];
            while (char !== '\n' && current < input.length) {
                value += char;
                char = input[++current];
            }
            tokens.push({ type: 'preprocessor', value: value.trim() });
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
            while (LETTERS.test(char) || NUMBERS.test(char)) {
                value += char;
                char = input[++current];
            }

            // Check if it's a keyword or type
            if (
                value === 'Global' || value === 'Function' || value === 'System' || 
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

    function walk() {
        let token = tokens[current]; let value;

        // Handle preprocessor directives (ignore them)
        if (token.type === 'comment') {
            current++;
            return null; // Skip preprocessor directives
        }

        if (token.type === 'preprocessor') {
            current++;
            return null; // Skip preprocessor directives
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
            value = token.value
            current++
            if(nextis('dot') && nextis('identifier', 1)){
                token = tokens[current++];
                value+= token.value;
                token = tokens[current++];
                value+= token.value;
            }
            return {
                type: 'Identifier',
                name: value,
            };
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
        if (token.type === 'keyword' && token.value === 'Function0') {
            token = tokens[++current]; // Skip 'Function'
            const name = token.value;

            token = tokens[++current]; // Skip '('
            const params = [];
            token = tokens[++current];

            while (token.value !== ')') {
                params.push(walk());
                token = tokens[current];
            }

            current++; // Skip ')'

            // const body = [];
            // token = tokens[current];

            // while (token.value !== '}') {
            //     body.push(walk());
            //     token = tokens[current];
            // }

            current++; // Skip '}'

            return {
                type: 'CustomFunctionDeclaration',
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
                params: []
            };
            while ( !(token.value == '}' && token.type == 'symbol') ) {
                node.params.push(walk());
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
      
            current++;
            return node;
        }
        // Handle function calls
        if (token.type === 'identifier' && tokens[current + 1]?.value === '(') {
            const name = token.value;
            current += 2; // Skip identifier and '('
            const args = [];
            while (tokens[current].value !== ')') {
                args.push(walk());
                current++;
            }
            current++; // Skip ')'
            return {
                type: 'FunctionCall',
                name,
                arguments: args,
            };
        }

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
        if(token.type=='comma'){
            current++;
            return {
                type: 'Separator', value: token.value
            }
        }

        if(token.type=='symbol'){
            current++;
            return {
                type: 'Symbol', value: token.value
            }
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

export {
    tokenizer,
    parser
}