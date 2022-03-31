import { getClass } from "../maki/objects";
import Button from "./makiClasses/Button";
import SystemObject from "./makiClasses/SystemObject";
import Container from "./makiClasses/Container";
import Layout from "./makiClasses/Layout";
import Layer from "./makiClasses/Layer";
import AnimatedLayer from "./makiClasses/AnimatedLayer";
import PopupMenu from "./makiClasses/PopupMenu";
import ToggleButton from "./makiClasses/ToggleButton";
import LayoutStatus from "./makiClasses/LayoutStatus";
import Status from "./makiClasses/Status";
import Text from "./makiClasses/Text";
import Group from "./makiClasses/Group";
import MakiMap from "./makiClasses/MakiMap";
import Timer from "./makiClasses/Timer";
import Slider from "./makiClasses/Slider";
import Vis from "./makiClasses/Vis";
import GuiObj from "./makiClasses/GuiObj";
import Config from "./makiClasses/Config";
import ConfigItem from "./makiClasses/ConfigItem";
import ConfigAttribute from "./makiClasses/ConfigAttribute";
import WinampConfig, { WinampConfigGroup } from "./makiClasses/WinampConfig";
import ComponentBucket from "./makiClasses/ComponentBucket";
import AlbumArt from "./makiClasses/AlbumArt";
import Region from "./makiClasses/Region";


const CLASSES = [
  Config,
  Config, ConfigItem, ConfigAttribute,
  WinampConfig, WinampConfigGroup,
  ComponentBucket,
  Region,
  AlbumArt,
  Button,
  SystemObject,
  Container,
  Layout,
  Layer,
  AnimatedLayer,
  PopupMenu,
  ToggleButton,
  Status,
  LayoutStatus,
  Text,
  Group,
  MakiMap,
  Timer,
  Slider,
  Vis,
  GuiObj,
];

const GUID_MAP = {};
for (const klass of CLASSES) {
  if (klass.GUID == null) {
    throw new Error("Expected GUID on class.");
  }
  GUID_MAP[klass.GUID] = klass;
}

// TODO: We could write a test using the data in object.ts which confirms that
// this is complete.
export function classResolver(guid: string): any {
  const klass = GUID_MAP[guid];
  if (klass == null) {
    throw new Error(
      `Unresolvable class "${getClass(guid).name}" (guid: ${guid})`
    );
  }
  return klass;
}
