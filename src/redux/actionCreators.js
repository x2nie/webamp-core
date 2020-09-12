export function closeModal() {
  return { type: "CLOSE_MODAL" };
}

export function searchQueryChanged(query) {
  return { type: "SEARCH_QUERY_CHANGED", query };
}

export function requestUnloadedSkin(index) {
  return { type: "REQUEST_UNLOADED_SKIN", index };
}

export function selectedSkin(hash, position) {
  return { type: "SELECTED_SKIN", hash, position };
}

export function requestedRandomSkin() {
  return { type: "REQUESTED_RANDOM_SKIN" };
}

export function gotNewMatchingSkins(skins) {
  return { type: "GOT_NEW_MATCHING_SKINS", skins };
}

export function loadedSkinZip(zip) {
  return { type: "LOADED_SKIN_ZIP", zip };
}

export function concentsToNsfw() {
  return { type: "CONCENTS_TO_NSFW" };
}

export function doesNotConcentToNsfw() {
  return { type: "DOES_NOT_CONCENT_TO_NSFW" };
}

export function toggleUploadView() {
  return { type: "TOGGLE_UPLOAD_VIEW" };
}

export function closeUploadFiles() {
  return { type: "CLOSE_UPLOAD_FILES" };
}

export function gotFiles(files) {
  return { type: "GOT_FILES", files };
}

export function gotFile(file, id) {
  return { type: "GOT_FILE", file, id };
}

export function invalidFileExtension(id) {
  return { type: "INVALID_FILE_EXTENSION", id };
}

export function notClassicSkin(id) {
  return { type: "NOT_CLASSIC_SKIN", id };
}

export function gotFileMd5(id, md5) {
  return { type: "GOT_FILE_MD5", id, md5 };
}

export function tryToUploadFile(id) {
  return { type: "TRY_TO_UPLOAD_FILE", id };
}

export function startingFileUpload(id) {
  return { type: "STARTING_FILE_UPLOAD", id };
}

export function tryToUploadAllFiles(id) {
  return { type: "TRY_TO_UPLOAD_ALL_FILES", id };
}

export function uploadFailed(id) {
  return { type: "UPLOAD_FAILED", id };
}

export function archivedSkin(id, response) {
  return { type: "ARCHIVED_SKIN", id, response };
}

export function gotMissingAndFoundMd5s({ missing, found }) {
  return { type: "GOT_MISSING_AND_FOUND_MD5S", missing, found };
}

export function checkIfUploadsAreMissing() {
  return { type: "CHECK_IF_UPLOADS_ARE_MISSING" };
}

export function selectSkinFile(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();

  return { type: "SELECTED_SKIN_FILE_TO_FOCUS", fileName, ext };
}

export function gotFocusedSkinFile(content) {
  return { type: "GOT_FOCUSED_SKIN_FILE", content };
}

export function requestedAboutPage() {
  return { type: "REQUESTED_ABOUT_PAGE" };
}

export function selectRelativeSkin(offset) {
  return { type: "SELECT_RELATIVE_SKIN", offset };
}

export function openFileExplorer() {
  return { type: "OPEN_FILE_EXPLORER" };
}

export function closeFileExlporer() {
  return { type: "CLOSE_FILE_EXPLORER" };
}
