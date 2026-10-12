import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(new URL("../src/workspaces/previewPolicy.ts", import.meta.url), "utf8");
const policy = await import("data:text/javascript;base64," + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString("base64"));
let count = 0;
const test = (name, fn) => { fn(); count++; console.log(`PASS ${name}`); };
const base = { obscured: false, inView: true, pageVisible: true, manual: false, paused: false, reducedMotion: false, saveData: false };
test("Previews enabled by default", () => assert.equal(policy.workspacePreviewsEnabled(undefined, ""), true));
test("Build flag restores posters", () => assert.equal(policy.workspacePreviewsEnabled("false", ""), false));
test("Feedback query restores posters", () => assert.equal(policy.workspacePreviewsEnabled("true", "?previews=static"), false));
test("Unrelated queries keep previews", () => assert.equal(policy.workspacePreviewsEnabled(undefined, "?utm_source=demo"), true));
test("Visible previews automatically play independently", () => assert.equal(policy.previewShouldPlay(base), true));
test("A second visible preview needs no selection or hover", () => assert.equal(policy.previewShouldPlay({ ...base }), true));
test("An expanded viewer pauses the other preview", () => assert.equal(policy.previewShouldPlay({ ...base, manual: true, obscured: true }), false));
for (const key of ["inView", "pageVisible"]) test(`${key} is required even for manual playback`, () => assert.equal(policy.previewShouldPlay({ ...base, manual: true, [key]: false }), false));
test("Explicit pause always wins", () => assert.equal(policy.previewShouldPlay({ ...base, manual: true, paused: true }), false));
for (const key of ["reducedMotion", "saveData"]) {
  test(`${key} prevents automatic playback`, () => assert.equal(policy.previewShouldPlay({ ...base, [key]: true }), false));
  test(`${key} permits explicit playback`, () => assert.equal(policy.previewShouldPlay({ ...base, manual: true, [key]: true }), true));
}
for (const asset of ["hedge-fund", "real-estate"]) {
  const path = new URL(`../public/workspace-previews/${asset}.webm`, import.meta.url);
  const bytes = await readFile(path); const info = await stat(path);
  test(`${asset} is valid-sized WebM media`, () => { assert.equal(bytes.subarray(0, 4).toString("hex"), "1a45dfa3"); assert.ok(info.size > 100_000 && info.size < 8_000_000); });
}
console.log(`${count} workspace preview checks passed.`);
