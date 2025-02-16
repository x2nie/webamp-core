/*
| Operator		|	Simbol			|	Prioritas       |
| Grouping		|	()	    		|   1 (Tertinggi)   |
| Unary	  		|	-x, !x			|	2   |
| Multiply		|	*, /, %			|	3   |
| Adiktif		|	+, -			|	4   |
| Relasional	|	<, <=, >, >=	|	5   |
| Kesetaraan	|	==, !=			|	6   |
| Logika AND  	| 	&&				|	7   |
| Logika OR  	| 	||              |	    |
*/

export type ASTNode =
    | { type: "IfExpression"; expect: ASTNode; body: ASTNode[] }
    | { type: "BinaryExpr"; operator: string; left: ASTNode; right: ASTNode }
    | { type: "UnaryExpr"; operator: string; expr: ASTNode }
    | { type: "identifier"; name: string }
    | { type: "NumberLiteral"; value: string };

export function buildExpressionTree(params: any[]): ASTNode {
    const ATOMS = ['identifier', 'NumberLiteral', 'StringLiteral', 'CallExpression']
    let i = 0;

    function parsePrimary(): ASTNode {
        let token = params[i++];

        // if (token.type === "identifier" || token.type === "NumberLiteral") {
        if (ATOMS.includes(token.type)) {
            return token;
        } else if (token.value === "(") {
            let expr = parseLogicalOr();
            if (params[i]?.value === ")") {
                i++; // Consume ')'
                return expr;
            }
            throw new Error("Expected closing parenthesis");
        } else if (token.value === "-" || token.value === "!") {
            let operator = token.value;
            let expr = parsePrimary();
            return { type: "UnaryExpr", operator, expr };
        }

        // throw new Error("Unexpected token: " + JSON.stringify(token));
        console.warn("Unexpected token: " + JSON.stringify(token));
    }

    function parseMultiplicative(): ASTNode {
        let left = parsePrimary();
        while (i < params.length && ["*", "/", "%"].includes(params[i].value)) {
            let operator = params[i++].value;
            let right = parsePrimary();
            left = { type: "BinaryExpr", operator, left, right };
        }
        return left;
    }

    function parseAdditive(): ASTNode {
        let left = parseMultiplicative();
        while (i < params.length && ["+", "-"].includes(params[i].value)) {
            let operator = params[i++].value;
            let right = parseMultiplicative();
            left = { type: "BinaryExpr", operator, left, right };
        }
        return left;
    }

    function parseRelational(): ASTNode {
        let left = parseAdditive();
        while (i < params.length && ["<", "<=", ">", ">="].includes(params[i].value)) {
            let operator = params[i++].value;
            let right = parseAdditive();
            left = { type: "BinaryExpr", operator, left, right };
        }
        return left;
    }

    function parseEquality(): ASTNode {
        let left = parseRelational();
        while (i < params.length && ["==", "!="].includes(params[i].value)) {
            let operator = params[i++].value;
            let right = parseRelational();
            left = { type: "BinaryExpr", operator, left, right };
        }
        return left;
    }

    function parseLogicalAnd(): ASTNode {
        let left = parseEquality();
        while (i < params.length && params[i].value === "&&") {
            let operator = params[i++].value;
            let right = parseEquality();
            left = { type: "BinaryExpr", operator, left, right };
        }
        return left;
    }

    function parseLogicalOr(): ASTNode {
        let left = parseLogicalAnd();
        while (i < params.length && params[i].value === "||") {
            let operator = params[i++].value;
            let right = parseLogicalAnd();
            left = { type: "BinaryExpr", operator, left, right };
        }
        return left;
    }

    return parseLogicalOr();
}

export function parseFunctionArguments(params: any[]): ASTNode[] {
  let parsedArguments: ASTNode[] = [];
  let tempArgs: any[] = [];

  for (let token of params) {
    if (token.type === "comma") {
      parsedArguments.push(buildExpressionTree(tempArgs));
      tempArgs = [];
    } else {
      tempArgs.push(token);
    }
  }

  if (tempArgs.length > 0) {
    parsedArguments.push(buildExpressionTree(tempArgs));
  }

  return parsedArguments;
}