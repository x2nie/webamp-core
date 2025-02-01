import { tokenizer, parser } from "./maki/compiler";

let input = `
/*
#include "../../lib/std.mi"

Global Button play_button, pause_button;
Global int VISMode;
Global int num = 0;
*/
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
//--------------------------------------------
// std.mi
//
// standard definitions for internal objects
//--------------------------------------------

/*
#ifndef __STD_MI
#define __STD_MI

#ifndef true
    #define true 1
#endif
#ifndef false
    #define false 0
#endif
*/

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

extern TreeItem.editLabel();
extern Int TreeItem.hasSubItems();

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
extern Int Object.onNotify(String command, String param, int a, int b);


// predecl system symbols
.CODE

    // This function is called by System.onScriptLoaded() as the first thing it does. 
    // Subsequent events check
    // __deprecated_runtime before continuing. If you have no System.onScriptLoaded(), 
    // you will have no version check.

    // This is to ensure that runtimes that do not have stack protection (that is wa3, 
    // wa5 and wa5.01) do not crash when trying to unexisting functions (with 
    // parameters, since parameterless functions would not crash), that is, functions 
    // that are meant for a higher version number than that of the runtime
    // the script is running on.

Function Int versionCheck();

Int versionCheck()
{
    Double v = getRuntimeVersion();
    if (v < VCPU_VERSION || v > 65535)
    {
        __deprecated_runtime = 1;
        int last = getPrivateInt(getSkinName(), "runtimecheck", 0);
        int now = getTimeOfDay();
        if (now - last < 5000 && last < now)
            return 0;
        setPrivateInt(getSkinName(), "runtimecheck", getTimeOfDay());
        messageBox("This script requires " + MC_TARGET, "Error", 1, "");
        return 0;
    }
    return 1;
}

// begin protecting the stack, anything below this requires a getRuntimeVersion() >= 1 and <= 65535
.STACKPROT


//#endif
`;

const song_stopper_m = `
#include <lib/std.mi>

Global Text debugtext;
Global Timer SongStop;
Global int i;

System.onScriptLoaded(){
    Group player = getScriptGroup();
    debugtext = player.findObject("debugtext");
    SongStop = new Timer;
    SongStop.setDelay(100);
}

// System.onInfoChange(String info){
System.onPlay(){
    SongStop.start();
}
System.onResume(){
    SongStop.start();
}

SongStop.onTimer(){
    // if(getPosition() >= 5000){
        SongStop.stop();
        System.pause();
    // }
    debugtext.setText(integerToString(getPosition()));
}

`

input = std_mi
// input = song_stopper_m
document.getElementById('code').innerText = input
const tokens = tokenizer(input);    document.getElementById('token').innerText = JSON.stringify(tokens, null, 2)
// console.log(tokens)
const ast = parser(tokens);         document.getElementById('parsed').innerText = JSON.stringify(ast, null, 2)

// window.loaded()