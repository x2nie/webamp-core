// Tokenizer
function tokenizer(input) {
    const tokens = [];
    let current = 0;

    const WHITESPACE = /\s/;
    const NUMBERS = /[0-9]/;
    const LETTERS = /[a-z_]/i;

    while (current < input.length) {
        let char = input[current];

        // Skip whitespace
        if (WHITESPACE.test(char)) {
            current++;
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
                value === 'int' || value === 'return' //|| value === 'Button'
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
            tokens.push({ type: 'dot', value: char });
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

    function walk() {
        let token = tokens[current];

        // Handle preprocessor directives (ignore them)
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
            current++;
            return {
                type: 'Identifier',
                name: token.value,
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
        if (token.type === 'keyword' && token.value === 'Function') {
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

            const body = [];
            token = tokens[current];

            while (token.value !== '}') {
                body.push(walk());
                token = tokens[current];
            }

            current++; // Skip '}'

            return {
                type: 'FunctionDeclaration',
                name,
                params,
                body,
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