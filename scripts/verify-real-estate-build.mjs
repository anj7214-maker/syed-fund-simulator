// Verification-only build for restricted Windows runners where compiler subprocesses are unavailable.
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import ts from "typescript";
const originalExec = childProcess.exec;
childProcess.exec = function(command, ...args) {
  if (process.platform === "win32" && command.trim().toLowerCase() === "net use") {
    const callback = args.at(-1);
    if (typeof callback === "function") queueMicrotask(() => callback(null, "", ""));
    return undefined;
  }
  return originalExec.call(this, command, ...args);
};
syncBuiltinESMExports();
const { build, preview } = await import("vite");
if (!process.argv.includes("--serve-only")) await build({ configFile: false, esbuild: false, plugins: [{ name: "verification-typescript", enforce: "pre", transform(code, id) {
  if (!/\.[cm]?[jt]sx?$/.test(id)) return;
  const compiled = id.includes("node_modules") ? code : ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, sourceMap: false } }).outputText;
  return { code: compiled.replaceAll("process.env.NODE_ENV", '"production"').replaceAll("process.env?.NODE_ENV", '"production"').replaceAll("process.env", '({NODE_ENV:"production"})').replaceAll("import.meta.hot", "undefined").replaceAll("import.meta.env.DEV", "false").replaceAll("import.meta.env.PROD", "true").replace(/import\.meta\.env\.VITE_[A-Z_]+/g, "undefined").replaceAll("import.meta.env", '({MODE:"production",DEV:false,PROD:true,BASE_URL:"/"})'), map: null };
} }], build: { outDir: ".verification-dist", minify: false, cssMinify: false }, optimizeDeps: { noDiscovery: true } });
if (process.argv.includes("--serve") || process.argv.includes("--serve-only")) {
  const server = await preview({ configFile: false, build: { outDir: ".verification-dist" }, plugins: [{ name: "local-qc-registration", configurePreviewServer(server) {
    server.middlewares.use("/api/visitors", (req, res) => { if (req.method !== "POST") { res.statusCode = 405; res.end(); return; } req.resume(); res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ registrationId: "local-qc-only" })); });
  } }], preview: { host: "127.0.0.1", port: 5174, strictPort: true } });
  console.log("Local verification only: registration uses a mock endpoint; no visitor data is stored or transmitted externally.");
  server.printUrls();
}
