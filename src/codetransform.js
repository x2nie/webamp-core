import { tokenizer, parser } from "./maki/compiler";

let input = `
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

const std_mi = `
//----------------------------------------------------------------------------------------------------------------
// std.mi
//
// standard definitions for internal objects
//----------------------------------------------------------------------------------------------------------------

#ifndef __STD_MI
#define __STD_MI

#ifndef true
#define true 1
#endif
#ifndef false
#define false 0
#endif

#define MC_TARGET "Winamp 5.02 (skin version 1.1)"

// GUIDS
extern class @{51654971-0D87-4a51-91E3-A6B53235F3E7}@ @{00000000-0000-0000-0000-000000000000}@ Object;
extern class @{D6F50F64-93FA-49b7-93F1-BA66EFAE3E98}@ Object _predecl System;
extern class @{E90DC47B-840D-4ae7-B02C-040BD275F7FC}@ Object GuiObject;
extern class @{B2023AB5-434D-4ba1-BEAE-59637503F3C6}@ Object &Layer;
extern class @{6B64CD27-5A26-4c4b-8C59-E6A70CF6493A}@ Layer &AnimatedLayer;
extern class @{2D2D1376-BE0A-4CB9-BC0C-57E6E4C999F5}@ GuiObject &Form;

#define WindowHolder Component

// class tree member functions & events

//*****************************************************************************
// Object CLASS
//*****************************************************************************
/**
 Object Class.

 @short    This is the base class from which all other classes inherit.
 @author   Nullsoft Inc.
 @ver  1.0
*/

/**
 getClassName()

 Returns the class name for the object.

 @ret The class name.
*/
extern String Object.getClassName();

/**
 getId()

*/
extern String Object.getId();

/**
 onNotify()

 @ret
 @param  command
 @param  param
 @param  a
 @param  b
*/
extern Int Object.onNotify(String command, String param, int a, int b);`;

input = std_mi
document.getElementById('code').innerText = input
const tokens = tokenizer(input);    document.getElementById('token').innerText = JSON.stringify(tokens, null, 2)
// console.log(tokens)
const ast = parser(tokens);         document.getElementById('parsed').innerText = JSON.stringify(ast, null, 2)

// window.loaded()