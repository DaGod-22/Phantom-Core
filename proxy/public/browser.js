let controller;
let frame;
const $ = id => document.getElementById(id);
const input = $("url");
const wrap = $("wrap");
const status = $("status");

function setStatus(text, show = true) {
  status.textContent = text;
  status.classList.toggle("hidden", !show);
}

function normalize(value) {
  const raw = value.trim();
  if (!raw) return "https://www.google.com/";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return raw;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) return `https://${raw}`;
  return `https://www.google.com/search?q=${encodeURIComponent(raw)}`;
}

async function getControlledServiceWorker(registration) {
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;

  await registration.update().catch(() => {});
  if (registration.active) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;

  // A newly registered service worker cannot control the page that registered
  // it until clients.claim() takes effect. Reload once so Scramjet starts with
  // a genuinely controlled page instead of a dead MessagePort.
  if (sessionStorage.getItem("phantom-sw-reloaded") !== "1") {
    sessionStorage.setItem("phantom-sw-reloaded", "1");
    location.reload();
    return new Promise(() => {});
  }

  throw new Error("Scramjet service worker is active but does not control this page");
}

async function init() {
  try {
    setStatus("Registering Scramjet service worker…");
    const registration = await navigator.serviceWorker.register("/sw.js", {
      type: "classic",
      scope: "/",
      updateViaCache: "none"
    });
    const serviceworker = await getControlledServiceWorker(registration);
    sessionStorage.removeItem("phantom-sw-reloaded");

    setStatus("Connecting to high-compatibility libcurl transport…");
    const { default: LibcurlClient } = await import("/libcurl/index.mjs");
    const cfgResponse = await fetch("/config", { cache: "no-store" });
    if (!cfgResponse.ok) throw new Error(`Config request failed (${cfgResponse.status})`);
    const cfg = await cfgResponse.json();

    const transport = new LibcurlClient({ wisp: cfg.wisp });
    await transport.init();

    setStatus("Initializing Scramjet WASM rewriter…");
    controller = new window.$scramjetController.Controller({
      serviceworker,
      transport,
      config: {
        prefix: cfg.prefix,
        scramjetPath: cfg.scramjetPath,
        injectPath: cfg.injectPath,
        wasmPath: cfg.wasmPath
      }
    });
    await controller.wait();

    frame = controller.createFrame();
    frame.element.className = "frame";
    frame.element.setAttribute("title", "Phantom Core browser");
    wrap.appendChild(frame.element);
    setStatus("Scramjet ready", false);

    navigate("https://www.google.com/");
  } catch (error) {
    console.error(error);
    setStatus(`Scramjet failed to initialize: ${error?.message || error}`);
  }
}

function navigate(value) {
  const url = normalize(value);
  input.value = url;
  if (!frame) return;
  setStatus("Loading…");
  frame.go(url);
  setTimeout(() => setStatus("", false), 1200);
}

$("form").addEventListener("submit", event => {
  event.preventDefault();
  navigate(input.value);
});

$("back").addEventListener("click", () => frame?.back());
$("forward").addEventListener("click", () => frame?.forward());
$("reload").addEventListener("click", () => frame?.reload());

init();
