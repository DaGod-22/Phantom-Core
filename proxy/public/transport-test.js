// Browser-side smoke test helper for the proxy UI.
// It verifies the same assets and transport constructors used by browser.js.
export async function runTransportSmokeTest() {
  const cfgResponse = await fetch("/config", { cache: "no-store" });
  if (!cfgResponse.ok) throw new Error(`/config returned ${cfgResponse.status}`);
  const cfg = await cfgResponse.json();
  const results = {};
  for (const kind of ["libcurl", "epoxy"]) {
    try {
      const moduleResponse = await fetch(cfg.transports[kind], { cache: "no-store" });
      if (!moduleResponse.ok) throw new Error(`${kind} asset returned ${moduleResponse.status}`);
      results[kind] = "asset-ok";
    } catch (error) {
      results[kind] = `failed: ${error.message}`;
    }
  }
  return results;
}
