export function workspacePreviewsEnabled(setting: string | undefined, search: string) {
  return setting !== "false" && new URLSearchParams(search).get("previews") !== "static";
}
export function previewShouldPlay(state: { obscured: boolean; inView: boolean; pageVisible: boolean; manual: boolean; paused: boolean; reducedMotion: boolean; saveData: boolean }) {
  return !state.obscured && state.inView && state.pageVisible && !state.paused && (state.manual || (!state.reducedMotion && !state.saveData));
}
