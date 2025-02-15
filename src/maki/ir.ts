import { ASTNode } from "./astTree";

type IRInstruction = string[];

export function generateIR(node: ASTNode, ir: IRInstruction = []): IRInstruction {
  if (node.type === "NumberLiteral") {
    ir.push(`PUSH ${node.value}`);
  } else if (node.type === "identifier") {
    ir.push(`PUSH ${node.name}`);
  } else if (node.type === "UnaryExpr") {
    generateIR(node.expr, ir);
    if (node.operator === "-") ir.push("NEG");
    else if (node.operator === "!") ir.push("NOT");
  } else if (node.type === "BinaryExpr") {
    generateIR(node.left, ir);
    generateIR(node.right, ir);
    const opMap: Record<string, string> = {
      "+": "ADD", "-": "SUB",
      "*": "MUL", "/": "DIV", "%": "MOD",
      "<": "LT", "<=": "LTE", ">": "GT", ">=": "GTE",
      "==": "EQ", "!=": "NEQ",
      "&&": "LOGAND", "||": "LOGOR"
    };
    ir.push(opMap[node.operator] || `UNKNOWN_OP_${node.operator}`);
  }
  return ir;
}
