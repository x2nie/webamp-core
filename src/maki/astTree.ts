export type ASTNode =
  | { type: "IfExpression"; expect: ASTNode; body: ASTNode[] }
  | { type: "BinaryExpr"; operator: string; left: ASTNode; right: ASTNode }
  | { type: "UnaryExpr"; operator: string; expr: ASTNode }
  | { type: "identifier"; name: string }
  | { type: "NumberLiteral"; value: string };

export function buildExpressionTree(params: any[]): ASTNode {
  let i = 0;

  function parsePrimary(): ASTNode {
    let token = params[i++];

    if (token.type === "identifier" || token.type === "NumberLiteral") {
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

    throw new Error("Unexpected token: " + JSON.stringify(token));
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