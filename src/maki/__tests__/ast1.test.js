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