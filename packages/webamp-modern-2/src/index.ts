import JSZip from "jszip";
// This module is imported early here in order to avoid a circular dependency.
import UI_ROOT from "./UIRoot";
import { getUrlQuery } from "./utils";
import { addDropHandler } from "./dropTarget";

addDropHandler(loadSkin);

const STATUS = document.getElementById("status");

function setStatus(status: string) {
  STATUS.innerText = status;
}

// const DEFAULT_SKIN = "assets/MMD3.wal"
const DEFAULT_SKIN = "assets/WinampModern566.wal"

async function main() {
  setStatus("Downloading skin...");
  const skinPath = getUrlQuery(window.location, "skin") || DEFAULT_SKIN;
  const response = await fetch(skinPath);
  const data = await response.blob();
  await loadSkin(data);
}

async function loadSkin(skinData: Blob) {
  UI_ROOT.reset();
  document.body.appendChild(UI_ROOT.getRootDiv());

  setStatus("Loading .wal archive...");
  const zip = await JSZip.loadAsync(skinData);
  UI_ROOT.setZip(zip);

  setStatus("Parsing XML and initializing images...");

  // This is always the same as the global singleton.
  const uiRoot = await UI_ROOT._parser.parse();

  const start = performance.now();
  uiRoot.enableDefaultGammaSet();
  const end = performance.now();
  console.log(`Loading initial gamma took: ${(end - start) / 1000}s`);

  setStatus("Rendering skin for the first time...");
  uiRoot.draw();
  uiRoot.init();

  setStatus("Initializing Maki...");
  for (const container of uiRoot.getContainers()) {
    container.init();
  }
  setStatus("");
}

main();
