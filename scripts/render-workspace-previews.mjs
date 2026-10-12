// Local-only encoder for approved synthetic screen captures. No application/API connection.
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const port = Number(process.env.PREVIEW_RENDER_PORT || 5190);
const origin = `http://127.0.0.1:${port}`;
const scenes = {
  "hedge-fund": { title: "Hedge Fund Accounting", seconds: 4, steps: [
    ["hf-01.png", "Take the operations desk", { chapter: "Investigate", metric: "Sandbox", detail: "Start with the fund, role and operational track. Synthetic data only.", crop: [.235, .17, .74, .67] }],
    ["hf-02.png", "Inspect the MSFT price", { chapter: "Pricing", metric: "421.80", detail: "Identify the source mark before making an operational adjustment.", crop: [.235, .15, .74, .62], focus: [.64, .475, .10, .055] }],
    ["hf-03.png", "Amend the mark", { chapter: "Recalculate", metric: "371.18", detail: "421.80 to 371.18. Recalculate the Sandbox NAV; the pricing review remains visible.", crop: [.235, .17, .74, .62], focus: [.64, .475, .10, .055], tone: "warning" }],
    ["hf-04.png", "Follow the impact into holdings", { chapter: "Trace", metric: "Connected books", detail: "The same source change flows through holdings and the NAV dependency chain.", crop: [.235, .14, .74, .62] }],
    ["hf-05.png", "Review the NAV result", { chapter: "NAV review", metric: "1362.9858", detail: "NAV/share: 1363.4340 to 1362.9858. Unresolved controls still block release.", crop: [.24, .51, .52, .45], tone: "warning" }],
  ] },
  "real-estate": { title: "Real Estate Fund Accounting", seconds: 3.5, steps: [
    ["re-01.png", "Open the real estate book", { chapter: "Close review", metric: "$35.01M NAV", detail: "Opening demonstration NAV: USD35,010,754.21. Follow the property-to-fund close.", crop: [.235, .17, .74, .64] }],
    ["re-02.png", "Investigate the valuation gap", { chapter: "Valuation", metric: "$10M to $8.8M", detail: "Harbor Office: carrying value versus valuation input. Supported evidence is required.", crop: [.235, .17, .74, .64], focus: [.384, .394, .155, .07], tone: "warning" }],
    ["re-03.png", "Prepare a supported correction", { chapter: "Evidence", metric: "Analyst proposal", detail: "Attach the synthetic appraisal reference. Posted NAV is unchanged at this stage.", crop: [.235, .18, .74, .65], focus: [.632, .364, .103, .091] }],
    ["re-04.png", "Send for independent review", { chapter: "Four-eyes", metric: "Submitted", detail: "The SME queue shows the analyst's proposal. Review and Controller approval precede posting.", crop: [.235, .20, .74, .62], tone: "warning" }],
    ["re-05.png", "Post the approved valuation", { chapter: "Post", metric: "-$1.20M impact", detail: "After review and approval: the correction posts and applicable valuation controls clear.", crop: [.235, .17, .74, .64], tone: "success" }],
    ["re-06.png", "Reconcile the final NAV", { chapter: "NAV tie-out", metric: "$33.81M NAV", detail: "Net assets and investor capital both equal USD33,810,754.21. The working shows source formulas.", crop: [.235, .32, .74, .68], tone: "success" }],
  ] },
};
for (const scene of Object.values(scenes)) for (const [file] of scene.steps) await readFile(resolve(root, ".data/preview-captures", file));
await mkdir(resolve(root, "public/workspace-previews"), { recursive: true });
const saved = new Set();
const frames = new Set(Object.values(scenes).flatMap(scene => scene.steps.map(([file]) => file)));
const server = createServer(async (req, res) => {
  try {
    if (req.headers.host !== `127.0.0.1:${port}`) { res.writeHead(403); res.end(); return; }
    const path = new URL(req.url, origin).pathname;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method === "GET" && path === "/") { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(await readFile(new URL("./workspace-preview-renderer.html", import.meta.url))); return; }
    if (req.method === "GET" && path === "/scenes") { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(scenes)); return; }
    if (req.method === "GET" && frames.has(path.slice(1))) { res.setHeader("Content-Type", "image/png"); res.end(await readFile(resolve(root, ".data/preview-captures", path.slice(1)))); return; }
    const asset = path.replace(/^\/save\//, "");
    if (req.method === "POST" && Object.hasOwn(scenes, asset) && path === `/save/${asset}`) {
      if (req.headers.origin !== origin || req.headers["content-type"] !== "video/webm") { res.writeHead(403); res.end(); return; }
      const chunks = []; let bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 8 * 1024 * 1024) throw new Error("Preview exceeds 8 MB limit."); chunks.push(chunk); }
      const data = Buffer.concat(chunks);
      if (data.length < 1000 || data.subarray(0, 4).toString("hex") !== "1a45dfa3") throw new Error("Invalid WebM recording.");
      await writeFile(resolve(root, "public/workspace-previews", `${asset}.webm`), data);
      saved.add(asset);
      res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ asset, bytes, seconds: scenes[asset].seconds * scenes[asset].steps.length }));
      console.log(`Saved ${asset}.webm: ${bytes} bytes`);
      if (saved.size === 2) { console.log("Both previews saved. Encoder closing."); server.close(); }
      return;
    }
    res.writeHead(404); res.end("Not found");
  } catch (error) { res.writeHead(400); res.end(error.message); }
});
server.listen(port, "127.0.0.1", () => console.log(`Local screen-capture encoder: ${origin}`));
setTimeout(() => server.close(), 600000).unref();
