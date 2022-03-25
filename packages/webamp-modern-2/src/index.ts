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
const DEFAULT_SKIN = "assets/WinampModern566.wal";

async function main() {
  setStatus("Downloading skin...");
  const skinPath = getUrlQuery(window.location, "skin") || DEFAULT_SKIN;
  const response = await fetch(skinPath);
  const data = await response.blob();
  await loadSkin(data);
}

async function loadSkin(skinData: Blob) {
  // Purposefully don't await, let this load in parallel.
  initializeSkinListMenu();
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

function gql(strings: TemplateStringsArray): string {
  return strings[0];
}

async function initializeSkinListMenu() {
  const query = gql`
    query {
      modern_skins(first: 1000) {
        nodes {
          filename
          download_url
        }
      }
    }
  `;

  const response = await fetch("https://api.webampskins.org/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    mode: "cors",
    credentials: "include",
    body: JSON.stringify({ query, variables: {} }),
  });

  const data = await response.json();

  const select = document.createElement("select");
  select.style.position = "absolute";
  select.style.bottom = "0";

  const current = getUrlQuery(window.location, "skin");

  for (const skin of data.data.modern_skins.nodes) {
    const option = document.createElement("option");
    option.value = skin.download_url;
    option.textContent = skin.filename;
    if (current === skin.download_url) {
      option.selected = true;
    }
    select.appendChild(option);
  }

  select.addEventListener("change", (e: any) => {
    const url = new URL(window.location.href);
    url.searchParams.set("skin", e.target.value);
    window.location.replace(url.href);
  });

  document.body.appendChild(select);
}

main();
