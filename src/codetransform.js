import { tokenizer, parser } from "./maki/compiler";

const input = `
#include "../../lib/std.mi"

Global Button play_button, pause_button;
Global int VISMode;
Global int num = 0;

Function addInts(int a, int b);

play_button.onLeftClick () {
    messageBox("play_button.onLeftClick", "Success", 0, "");
}

addInts (int a, int b)
{
    Int sum = a + b;
    return sum;
}

System.onScriptLoaded()
{
    messageBox("onScriptLoaded", "Success", 0, "");

    play_button = getContainer("main").getLayout("normal").findObject("Play");

    play_button.leftClick();
}
`;
document.getElementById('code').innerText = input
const tokens = tokenizer(input);    document.getElementById('token').innerText = JSON.stringify(tokens, null, 2)
// console.log(tokens)
const ast = parser(tokens);         document.getElementById('parsed').innerText = JSON.stringify(ast, null, 2)

// window.loaded()