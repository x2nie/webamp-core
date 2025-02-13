// -------------------------------------------------------------------
// corneramp support script
// by Evil Pumpkin for Nine of Nine
// -------------------------------------------------------------------

#include "../../../lib/std.mi"

Global Layout Main;

Global Layer Volume1, Volumethumb,Seek1,seekfull;
Class Layer Mains;
Global Mains Main1, Main2,main3,main4,mask1,mask2,mask3,mask4;
Global Text Time, Songticker, Songticker2;
Global Status Stat;
Global Map Volumemap;
Global Region Volumeregion;
Global Int Voling,Seeking,Changing,CheckPos,LastTmp,Moving,Lastx,Lasty;
Global Slider HidSeek,HidVolume;
Global Popupmenu ChoseCorner;

Global Button Previous,Play,Pause,Stop,Next,Eject, eq, ml, pl;
Global Layer title1,title2,title3,title4;
Global Togglebutton Crossfade, shuffle, repeat;

Function UpdateVolume(int y);
Function InitVolume();
Function UpdateSeek(int y);
Function ChangeToCorner(int c);
Function HideAll();

System.onScriptLoaded(){
  Main = getContainer("Main").getLayout("normal");
  Main1 = Main.getObject("Main1");
  Main2 = Main.getObject("Main2");
  Main3 = Main.getObject("Main3");
  Main4 = Main.getObject("Main4");
  Mask1 = Main.getObject("Mask1");
  Mask2 = Main.getObject("Mask2");
  Mask3 = Main.getObject("Mask3");
  Mask4 = Main.getObject("Mask4");
  Volume1 = Main.getObject("Volume1");
  Volumethumb = Main.getObject("Volumethumb");
  HidSeek = Main.getObject("HiddenSeek");
  HidVolume = Main.getObject("HiddenVolume");
  Seek1 = Main.getObject("Seek1");
  Seekfull = Main.getObject("Seekfull");

  Previous = Main.getObject("Previous");
  Play = Main.getObject("Play");
  Pause = Main.getObject("Pause");
  Stop = Main.getObject("Stop");
  Next = Main.getObject("Next");
  Eject = Main.getObject("Eject");

  Crossfade = Main.getObject("Crossfade");
  shuffle = Main.getObject("shuffle");
  repeat = Main.getObject("repeat");
  eq = Main.getObject("eq");
  ml = Main.getObject("ml");
  pl = Main.getObject("pl");

  Time = Main.getObject("Timer");
  Songticker = Main.getObject("Songticker");
  Songticker2 = Main.getObject("Songticker2");
  Title1 = Main.getObject("Title1");
  Title2 = Main.getObject("Title2");
  Title3 = Main.getObject("Title3");
  Title4 = Main.getObject("Title4");

  Stat = Main.getObject("Status");

  Voling = 0;
  if ((getleftvumeter()+getrightvumeter())/2 != 0){seekfull.show();}
   else{seekfull.hide();};
  InitVolume();

  ChoseCorner = New PopupMenu;
  ChoseCorner.addCommand("Chose Corner", 5, 0, 1);
  ChoseCorner.addSeparator();
  ChoseCorner.addCommand("Left Up Corner", 1, 0, 0);
  ChoseCorner.addCommand("Right Up Corner", 2, 0, 0);
  ChoseCorner.addCommand("Left Down Corner", 3, 0, 0);
  ChoseCorner.addCommand("Right Down Corner", 4, 0, 0);

  HideAll();
  //if (GetPrivateInt("Corner", "LastPos", 1) == 0)
  //{
   ChangeToCorner(GetPrivateInt("Corner", "LastPos", 1));
  //}
  //else {ChangeToCorner(4);} // Changed 1 to 4 to fix initial position bug
}

System.onstop(){
  Seekfull.hide();
}

system.onplay(){
  updateseek(0);
seekfull.show();
}

Seek1.onLeftButtonDown(int x, int y){
x = x- seek1.getleft();
  Seeking = 1;
  Seekfull.setXmlParam("w", System.integerToString(x-seekfull.getleft()));
  Seekto(x/seek1.getwidth()*System.getPlayItemLength());
}

Seek1.onMouseMove(int x, int y){
x = x- seek1.getleft();
if (seeking){
  Seekfull.setXmlParam("w", System.integerToString(x-seekfull.getleft()));
  Seekto(x/seek1.getwidth()*System.getPlayItemLength());}
  }
Seek1.onLeftButtonUp(int x, int y){
  seeking = 0;
}


HidSeek.onPostedPosition(int p){
  Updateseek(p);
}

Seek1.onLeftButtonDown(int x, int y){
  seeking = 1;
}


HidVolume.onPostedPosition(int c){
  c = 37-(c/255*37);
  volumethumb.setXmlParam("y", System.integerToString(c+volume1.gettop()));
}

volume1.onLeftButtonDown(int x, int y){
  voling = 1;
  x = x-volume1.getleft();
  y= y-volume1.gettop();
  if ((y>=0) && (y<=37)){
    Updatevolume(y);
  };
}

Volume1.onMouseMove(int x, int y){
 if (voling){
   x = x-volume1.getleft();
   y= y-volume1.gettop();
   if ((y>=0) && (y<=37)){
     Updatevolume(y);
   };
 };
}

volume1.onLeftButtonUp(int x, int y){
  voling = 0;
}

UpdateVolume(int y){
  volumethumb.setXmlParam("y", System.integerToString(y+volume1.gettop()));
  y = 255-(y/37*255);
  system.setvolume(y);
}

InitVolume(){
  y = system.getvolume();
  y = 37-(y/255*37);
  volumethumb.setXmlParam("y", System.integerToString(y+volume1.gettop()));
}

UpdateSeek(int y){
  y = y/255*151;
  Seekfull.setXmlParam("w", System.integerToString(y));
}

Title1.onleftbuttonup(int x, int y){
 If (LastTmp !=0){
  ChangeToCorner(LastTmp);}
  LastTmp = 1;
 }
Title2.onleftbuttonup(int x, int y){
 If (LastTmp !=0){
  ChangeToCorner(LastTmp);}
  LastTmp = 2;
}
Title3.onleftbuttonup(int x, int y){
 If (LastTmp !=0){
  ChangeToCorner(LastTmp);}
  LastTmp = 3;
}
Title4.onleftbuttonup(int x, int y){
 If (LastTmp !=0){
  ChangeToCorner(LastTmp);}
  LastTmp = 4;
}

Title1.onrightbuttonup(int x, int y){
  LastTmp = 1;
  ChoseCorner.checkCommand(1, (LastTmp == 1));
  ChoseCorner.checkCommand(2, (LastTmp == 2));
  ChoseCorner.checkCommand(3, (LastTmp == 3));
  ChoseCorner.checkCommand(4, (LastTmp == 4));
  Changing =  ChoseCorner.popAtMouse();
  ChangetoCorner(changing);
  Complete;
}

Title2.onrightbuttonup(int x, int y){
  LastTmp = 2;
  ChoseCorner.checkCommand(1, (LastTmp == 1));
  ChoseCorner.checkCommand(2, (LastTmp == 2));
  ChoseCorner.checkCommand(3, (LastTmp == 3));
  ChoseCorner.checkCommand(4, (LastTmp == 4));
  Changing =  ChoseCorner.popAtMouse();
  ChangetoCorner(changing);
  Complete;
}

Title3.onrightbuttonup(int x, int y){
  LastTmp = 3;
  ChoseCorner.checkCommand(1, (LastTmp == 1));
  ChoseCorner.checkCommand(2, (LastTmp == 2));
  ChoseCorner.checkCommand(3, (LastTmp == 3));
  ChoseCorner.checkCommand(4, (LastTmp == 4));
  Changing =  ChoseCorner.popAtMouse();
  ChangetoCorner(changing);
  Complete;
}

Title4.onrightbuttonup(int x, int y){
  LastTmp = 4;
  ChoseCorner.checkCommand(1, (LastTmp == 1));
  ChoseCorner.checkCommand(2, (LastTmp == 2));
  ChoseCorner.checkCommand(3, (LastTmp == 3));
  ChoseCorner.checkCommand(4, (LastTmp == 4));
  Changing =  ChoseCorner.popAtMouse();
  ChangetoCorner(changing);
  Complete;
}

ChangeToCorner(int c){
 Changing = c;

 if (changing == 1){
   Setprivateint("Corner", "LastPos", 1);
   HideAll();
   Title1.resize(0,92,title1.getwidth(),title1.getheight());
   Title1.Show();
   main.setXmlParam("background","player.bg");
   main.resize(0,0,main.getwidth(),main.getheight());
   main1.show();
   Mask1.show();
   Previous.setXmlParam("x", "13");
   Previous.setXmlParam("y", "183");
   Play.setXmlParam("x", "37");
   Play.setXmlParam("y", "142");
   Pause.setXmlParam("x", "66");
   Pause.setXmlParam("y", "102");
   Stop.setXmlParam("x", "104");
   Stop.setXmlParam("y", "65");
   Next.setXmlParam("x", "148");
   Next.setXmlParam("y", "36");
   Eject.setXmlParam("x", "198");
   Eject.setXmlParam("y", "14");

   Crossfade.setXmlParam("x", "78");
   Crossfade.setXmlParam("y", "-1");
   shuffle.setXmlParam("x", "109");
   shuffle.setXmlParam("y", "-1");
   repeat.setXmlParam("x", "112");
   repeat.setXmlParam("y", "-15");
   eq.setXmlParam("x", "0");
   eq.setXmlParam("y", "-1");
   ml.setXmlParam("x", "25");
   ml.setXmlParam("y", "-1");
   pl.setXmlParam("x", "51");
   pl.setXmlParam("y", "-1");

   Volume1.setXmlParam("x", "3");
   Volume1.setXmlParam("y", "95");
   Volumethumb.setXmlParam("x", "3");
   Volumethumb.setXmlParam("y", System.integerToString(Volumethumb.gettop()));

   Time.setXmlParam("x", "12");
   Time.setXmlParam("y", "63");
   Songticker.setXmlParam("x", "2");
   Songticker.setXmlParam("y", "26");
   Songticker2.setXmlParam("x", "2");
   Songticker2.setXmlParam("y", "42");

   Seek1.setXmlParam("x", "3");
   Seek1.setXmlParam("y", "16");
   Seekfull.setXmlParam("x", "3");
   Seekfull.setXmlParam("y", "21");
   Seekfull.setXmlParam("w", System.integerToString(seekfull.getwidth()));

   Stat.setXmlParam("x", "3");
   Stat.setXmlParam("y", "81");
 };
 if (changing == 2){
   Setprivateint("Corner", "LastPos", 2);
   HideAll();
   main.setXmlParam("background","player.bg5");
   main.resize(getviewportwidth()-246,0,main.getwidth(),main.getheight());
   Main2.show();
   Mask2.show();
   Title2.show();

   Previous.setXmlParam("x", "194");
   Previous.setXmlParam("y", "183");
   Play.setXmlParam("x", "170");
   Play.setXmlParam("y", "142");
   Pause.setXmlParam("x", "141");
   Pause.setXmlParam("y", "102");
   Stop.setXmlParam("x", "103");
   Stop.setXmlParam("y", "65");
   Next.setXmlParam("x", "59");
   Next.setXmlParam("y", "36");
   Eject.setXmlParam("x", "9");
   Eject.setXmlParam("y", "14");

   Crossfade.setXmlParam("x", "136");
   Crossfade.setXmlParam("y", "-1");
   shuffle.setXmlParam("x", "109");
   shuffle.setXmlParam("y", "-1");
   repeat.setXmlParam("x", "62");
   repeat.setXmlParam("y", "-15");
   eq.setXmlParam("x", "220");
   eq.setXmlParam("y", "-1");
   ml.setXmlParam("x", "194");
   ml.setXmlParam("y", "-1");
   pl.setXmlParam("x", "167");
   pl.setXmlParam("y", "-1");

   Volume1.setXmlParam("x", "238");
   Volume1.setXmlParam("y", "95");
   Volumethumb.setXmlParam("x", "238");
   Volumethumb.setXmlParam("y", System.integerToString(Volumethumb.gettop()));

   Time.setXmlParam("x", "169");
   Time.setXmlParam("y", "63");
   Songticker.setXmlParam("x", "108");
   Songticker.setXmlParam("y", "26");
   Songticker2.setXmlParam("x", "124");
   Songticker2.setXmlParam("y", "42");

   Seek1.setXmlParam("x", "92");
   Seek1.setXmlParam("y", "16");
   Seekfull.setXmlParam("x", "92");
   Seekfull.setXmlParam("y", "21");
   Seekfull.setXmlParam("w", System.integerToString(seekfull.getwidth()));

   Stat.setXmlParam("x", "238");
   Stat.setXmlParam("y", "81");
 };
 if (changing == 3){
   Setprivateint("Corner", "LastPos", 3);
   HideAll();
   main.setXmlParam("background","player.bg6");
   main.resize(0,getviewportheight()-main.getheight(),main.getwidth(),main.getheight());
   Main3.show();
   Mask3.show();
   Title3.show();
   Previous.setXmlParam("x", "13");
   Previous.setXmlParam("y", "6");
   Play.setXmlParam("x", "37");
   Play.setXmlParam("y", "47");
   Pause.setXmlParam("x", "66");
   Pause.setXmlParam("y", "87");
   Stop.setXmlParam("x", "104");
   Stop.setXmlParam("y", "124");
   Next.setXmlParam("x", "148");
   Next.setXmlParam("y", "153");
   Eject.setXmlParam("x", "198");
   Eject.setXmlParam("y", "175");

   Crossfade.setXmlParam("x", "78");
   Crossfade.setXmlParam("y", "213");
   shuffle.setXmlParam("x", "109");
   shuffle.setXmlParam("y", "213");
   repeat.setXmlParam("x", "112");
   repeat.setXmlParam("y", "213");
   eq.setXmlParam("x", "0");
   eq.setXmlParam("y", "213");
   ml.setXmlParam("x", "25");
   ml.setXmlParam("y", "213");
   pl.setXmlParam("x", "51");
   pl.setXmlParam("y", "213");

   Volume1.setXmlParam("x", "3");
   Volume1.setXmlParam("y", "95");
   Volumethumb.setXmlParam("x", "3");
   Volumethumb.setXmlParam("y", System.integerToString(Volumethumb.gettop()));

   Time.setXmlParam("x", "12");
   Time.setXmlParam("y", "137");
   Songticker.setXmlParam("x", "2");
   Songticker.setXmlParam("y", "187");
   Songticker2.setXmlParam("x", "2");
   Songticker2.setXmlParam("y", "175");

   Seek1.setXmlParam("x", "3");
   Seek1.setXmlParam("y", "202");
   Seekfull.setXmlParam("x", "3");
   Seekfull.setXmlParam("y", "207");
   Seekfull.setXmlParam("w", System.integerToString(seekfull.getwidth()));

   Stat.setXmlParam("x", "3");
   Stat.setXmlParam("y", "142");
 };
 if (changing == 4){
   Setprivateint("Corner", "LastPos", 4);
   HideAll();
   main.setXmlParam("background","player.bg7");
   main.resize(getviewportwidth()-246,getviewportheight()-228,main.getwidth(),main.getheight());
   Main4.show();
   Mask4.show();
   Title4.show();

   Previous.setXmlParam("x", "194");
   Previous.setXmlParam("y", "6");
   Play.setXmlParam("x", "170");
   Play.setXmlParam("y", "47");
   Pause.setXmlParam("x", "141");
   Pause.setXmlParam("y", "87");
   Stop.setXmlParam("x", "103");
   Stop.setXmlParam("y", "124");
   Next.setXmlParam("x", "59");
   Next.setXmlParam("y", "153");
   Eject.setXmlParam("x", "9");
   Eject.setXmlParam("y", "175");

   Crossfade.setXmlParam("x", "136");
   Crossfade.setXmlParam("y", "213");
   shuffle.setXmlParam("x", "109");
   shuffle.setXmlParam("y", "213");
   repeat.setXmlParam("x", "62");
   repeat.setXmlParam("y", "213");
   eq.setXmlParam("x", "220");
   eq.setXmlParam("y", "213");
   ml.setXmlParam("x", "194");
   ml.setXmlParam("y", "213");
   pl.setXmlParam("x", "167");
   pl.setXmlParam("y", "213");

   Volume1.setXmlParam("x", "238");
   Volume1.setXmlParam("y", "95");
   Volumethumb.setXmlParam("x", "238");
   Volumethumb.setXmlParam("y", System.integerToString(Volumethumb.gettop()));

   Time.setXmlParam("x", "169");
   Time.setXmlParam("y", "137");
   Songticker.setXmlParam("x", "102");
   Songticker.setXmlParam("y", "187");
   Songticker2.setXmlParam("x", "124");
   Songticker2.setXmlParam("y", "175");

   Seek1.setXmlParam("x", "92");
   Seek1.setXmlParam("y", "202");
   Seekfull.setXmlParam("x", "92");
   Seekfull.setXmlParam("y", "207");
   Seekfull.setXmlParam("w", System.integerToString(seekfull.getwidth()));

   Stat.setXmlParam("x", "238");
   Stat.setXmlParam("y", "142");
 };

}

HideAll(){
  Main1.hide();
  Main2.hide();
  Main3.hide();
  Main4.hide();

  Mask1.hide();
  Mask2.hide();
  Mask3.hide();
  Mask4.hide();

  Title1.hide();
  Title2.hide();
  Title3.hide();
  Title4.hide();
}

Main1.OnLeftButtonDown(int x, int y){
 Lastx=GetCurAppLeft();
 Lasty=GetCurAppTop();
}

Main1.OnLeftButtonUp(int x, int y){
 LastTmp = 1;
 Lastx=GetCurAppLeft()-Lastx;
 Lasty=GetCurAppTop()-Lasty;
 If ((Lastx !=0) || (Lasty !=0)){
   if ((GetCurAppLeft()<Getviewportwidth()/2) && (GetCurAppTop()<GetViewportHeight()/2)){
    ChangeTocorner(1);}
   if ((GetCurAppLeft()>Getviewportwidth()/2) && (GetCurAppTop()<GetViewportHeight()/2)){
    ChangeTocorner(2);}
   if ((GetCurAppLeft()<Getviewportwidth()/2) && (GetCurAppTop()>GetViewportHeight()/2)){
    ChangeTocorner(3);}
   if ((GetCurAppLeft()>Getviewportwidth()/2) && (GetCurAppTop()>GetViewportHeight()/2)){
    ChangeTocorner(4);}
 }
}

Main2.OnLeftButtonDown(int x, int y){
 Lastx=GetCurAppLeft();
 Lasty=GetCurAppTop();
}

Main2.OnLeftButtonUp(int x, int y){
 LastTmp = 2;
 Lastx=GetCurAppLeft()-Lastx;
 Lasty=GetCurAppTop()-Lasty;
 If ((Lastx !=0) || (Lasty !=0)){
   if ((GetCurAppLeft()<Getviewportwidth()/2) && (GetCurAppTop()<GetViewportHeight()/2)){
    ChangeTocorner(1);}
   if ((GetCurAppLeft()>Getviewportwidth()/2) && (GetCurAppTop()<GetViewportHeight()/2)){
    ChangeTocorner(2);}
   if ((GetCurAppLeft()<Getviewportwidth()/2) && (GetCurAppTop()>GetViewportHeight()/2)){
    ChangeTocorner(3);}
   if ((GetCurAppLeft()>Getviewportwidth()/2) && (GetCurAppTop()>GetViewportHeight()/2)){
    ChangeTocorner(4);}
 }
}

Main3.OnLeftButtonDown(int x, int y){
 Lastx=GetCurAppLeft();
 Lasty=GetCurAppTop();
}

Main3.OnLeftButtonUp(int x, int y){
 LastTmp = 3;
 Lastx=GetCurAppLeft()-Lastx;
 Lasty=GetCurAppTop()-Lasty;
 If ((Lastx !=0) || (Lasty !=0)){
   if ((GetCurAppLeft()<Getviewportwidth()/2) && (GetCurAppTop()<GetViewportHeight()/2)){
    ChangeTocorner(1);}
   if ((GetCurAppLeft()>Getviewportwidth()/2) && (GetCurAppTop()<GetViewportHeight()/2)){
    ChangeTocorner(2);}
   if ((GetCurAppLeft()<Getviewportwidth()/2) && (GetCurAppTop()>GetViewportHeight()/2)){
    ChangeTocorner(3);}
   if ((GetCurAppLeft()>Getviewportwidth()/2) && (GetCurAppTop()>GetViewportHeight()/2)){
    ChangeTocorner(4);}
 }
}

Main4.OnLeftButtonDown(int x, int y){
 Lastx=GetCurAppLeft();
 Lasty=GetCurAppTop();
}

Main4.OnLeftButtonUp(int x, int y){
 LastTmp = 4;
 Lastx=GetCurAppLeft()-Lastx;
 Lasty=GetCurAppTop()-Lasty;
 If ((Lastx !=0) || (Lasty !=0)){
   if ((GetCurAppLeft()<Getviewportwidth()/2) && (GetCurAppTop()<GetViewportHeight()/2)){
    ChangeTocorner(1);}
   if ((GetCurAppLeft()>Getviewportwidth()/2) && (GetCurAppTop()<GetViewportHeight()/2)){
    ChangeTocorner(2);}
   if ((GetCurAppLeft()<Getviewportwidth()/2) && (GetCurAppTop()>GetViewportHeight()/2)){
    ChangeTocorner(3);}
   if ((GetCurAppLeft()>Getviewportwidth()/2) && (GetCurAppTop()>GetViewportHeight()/2)){
    ChangeTocorner(4);}
 }
}
