import { ASTNode } from "./astTree";

type IRInstruction = string[];
type Solver = (node:ASTNode) => string;
const solver = (node:ASTNode) => JSON.stringify(node).replace(/"/g,"'");

export function generateIR(node: ASTNode, solve:Solver=solver, ir: IRInstruction = []): IRInstruction {
    if(!node || !node.type) {
        debugger
    }

    if (node.type === "NumberLiteral") {
        ir.push(`PUSH ${solve(node)}`);
    }
    else if (node.type === "identifier") {
        ir.push(`PUSH ${solve(node)}`);
    }
    else if (node.type === "UnaryExpr") {
        generateIR(node.expr, solve, ir);
        if (node.operator === "-") ir.push("NEG");
        else if (node.operator === "!") ir.push("NOT");
    }
    else if (node.type === "BinaryExpr") {
        generateIR(node.left, solve, ir);
        generateIR(node.right, solve, ir);
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
