#include "../../../lib/std.mi"
#include "utility.m"

Function updateCover();
Function Int strCharCount(String strValue, String strSearchValue);

Global Group groupScript;
Global Layer layerCoverA;
Global Layer layerCoverB;
Global Float fltTransitionTime;

System.onScriptLoaded() {
	groupScript = System.getScriptGroup();
	layerCoverA = groupScript.findObject("cover.image.a");
	layerCoverB = groupScript.findObject("cover.image.b");
	
	fltTransitionTime = 0.5;
	
	if (System.getPlayItemString() != "") updateCover();
}

System.onSetXuiParam(String strParam, String strValue) {
	if (System.strLower(strParam) == "transitiontime") fltTransitionTime = System.stringToFloat(strValue);
}

System.onTitleChange(String strNewTitle) {
	updateCover();
}

updateCover() {
	String strCoverFilePath = getCoverFilePath();

	if (strCoverFilePath != "") {
		if (layerCoverA.getXMLParam("image") != strCoverFilePath) {
			layerCoverB.setXMLParam("image", layerCoverA.getXMLParam("image"));
			layerCoverB.setAlpha(layerCoverA.getAlpha());
			layerCoverA.setXMLParam("image", strCoverFilePath);
			layerCoverA.setAlpha(0);
			animateLayerAlpha(layerCoverA, 255, fltTransitionTime);
			animateLayerAlpha(layerCoverB, 0, fltTransitionTime);
		}
	} else {
		layerCoverB.setXMLParam("image", layerCoverA.getXMLParam("image"));
		layerCoverB.setAlpha(layerCoverA.getAlpha());
		layerCoverA.setXMLParam("image", "");
		layerCoverA.setAlpha(0);
		animateLayerAlpha(layerCoverB, 0, fltTransitionTime);
	}
}

Int strCharCount(String strValue, String strSearchValue) {
	Int intStringLength;
	Int intReturnValue;
	String strCurrentChar;
	
	intReturnValue = 0;
	
	if (strValue != "") {
		intStringLength = System.strLen(strValue);
		for (Int i = 0; i < intStringLength; i++) {
			strCurrentChar = System.strMid(strValue, i, 1);
			if (strCurrentChar == strSearchValue) intReturnValue++;
		}
		return intReturnValue;
	} else {
		return 0;
	}
}