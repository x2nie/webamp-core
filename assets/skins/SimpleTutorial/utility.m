Function String getCoverFilePath();
Function Int strCharCount(String strValue, String strSearchValue);
Function debugAlert(String strValue);
Function animateLayerAlpha(GuiObject objTarget, Int intTargetA, Float fltTargetSpeed);

String getCoverFilePath() {
	Map mapCover = new Map;
	String strFileLocation = System.getPlayItemString();
	String strCoverFileNames = "cover.jpg;coverart.jpg;folder.jpg;front.jpg";
	String strCoverFileName;
	
	strFileLocation = System.strLeft(strFileLocation, System.strSearch(strFileLocation, System.removePath(strFileLocation)));
	strFileLocation = System.strRight(strFileLocation, System.strLen(strFileLocation) - (System.strSearch(strFileLocation, "//") + 2));
	
	Int intTokenCount = strCharCount(strCoverFileNames, ";");

	for (Int i = 0; i <= intTokenCount; i++) {
		strCoverFilename = System.getToken(strCoverFileNames, ";", i);
		mapCover.loadMap(strFileLocation + strCoverFileName);
		if (mapCover.getValue(0, 0) > 0) {
			delete mapCover;
			return strFileLocation + strCoverFileName;
		}
	}
	
	delete mapCover;
	return "";
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

debugAlert(String strValue) {
	System.messageBox(strValue, "Debug Alert", 0, "");
}

animateLayerAlpha(GuiObject objTarget, Int intTargetA, Float fltTargetSpeed) {
	objTarget.setTargetA(intTargetA);
	objTarget.setTargetSpeed(fltTargetSpeed);
	objTarget.gotoTarget();
}