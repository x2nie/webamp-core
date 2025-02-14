import { expect, test } from 'vitest'
import { code2ast, code2statement } from '../compiler'

test('simple assignment', () => {
    const statement = code2statement('__deprecated_runtime = 1;');
    expect(statement[0]).toEqual({
        "type": "Assignment",
        "left": {
            "type": "identifier",
            "value": "__deprecated_runtime"
        },
        "operator": "=",
        "right": {
            "type": "number",
            "value": "1"
        }
    })
})

test('local var assignment', () => {
    const statement = code2statement('int __deprecated_runtime = 1;');
    expect(statement[0]).toEqual({
        "type": "Assignment",
        "left": {
            "name": "__deprecated_runtime",
            "type": "LocalVar",
            "varType": "int",
        },
        "operator": "=",
        "right": {
            "type": "number",
            "value": "1"
        }
    })
})


test('if', () => {
    const ast = code2ast('if (now < 5000) return 0;');
    expect(ast[0]).toEqual({
        "type": "IfExpression",
        "expect": {
            "type": "Parameters",
            "params": [
                {
                    "type": "identifier",
                    "name": "now"
                },
                {
                    "type": "symbol",
                    "value": "<"
                },
                {
                    "type": "NumberLiteral",
                    "value": "5000"
                }
            ]
        },
        "body": [
            {
                "type": "Return",
                "value": {
                    "type": "NumberLiteral",
                    "value": "0"
                }
            }
        ]
    })
})


test('if else', () => {
    const ast = code2ast('if (now < 5000) return 0; else songInfoTimer.setDelay(250);');
    expect(ast).toEqual([
        {
            "type": "IfExpression",
            "expect": {
                "type": "Parameters",
                "params": [
                    {
                        "type": "identifier",
                        "name": "now"
                    },
                    {
                        "type": "symbol",
                        "value": "<"
                    },
                    {
                        "type": "NumberLiteral",
                        "value": "5000"
                    }
                ]
            },
            "body": [
                {
                    "type": "Return",
                    "value": {
                        "type": "NumberLiteral",
                        "value": "0"
                    }
                }
            ]
        },
        {
            "type": "Terminator",
            "value": ";"
        },
        {
            "type": "ElseExpression",
            "body": [
                {
                    "type": "CallExpression",
                    "name": "songInfoTimer.setDelay",
                    "arguments": [
                        {
                            "type": "NumberLiteral",
                            "value": "250"
                        }
                    ]
                }
            ]
        }
    ])
})