import { combineReducers } from "redux";

import playlist from "./playlist";
import windows from "./windows";
import media from "./media";
import display from "./display";
import userInput from "./userInput";
import equalizer from "./equalizer";
import network from "./network";
import settings from "./settings";

const reducer = combineReducers({
  userInput,
  windows,
  display,
  settings,
  equalizer,
  playlist,
  media,
  network
});

export default reducer;
