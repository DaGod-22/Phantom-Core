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

async function waitForControl(registration) {
  if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;
  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve(registration.active || null), 10000);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      clearTimeout(timeout);
      resolve(navigator.serviceWorker.controller || registration.active || null);
    }, { once: true });
  });
}

async function init() {
  try {
    setStatus("Registering Scramjet service worker…");
    const registration = await navigator.serviceWorker.register("/sw.js", { type: "classic", scope: "/" });
    const serviceworker = await waitForControl(registration);
    if (!serviceworker) throw new Error("Service worker did not become active");

    setStatus("Connecting to Wisp transport…");
    const { default: LibcurlClient } = await import("/libcurl/index.mjs");
    const cfg = await fetch("/config", { cache: "no-store" }).then(r => r.json());
    const transport = new LibcurlClient({ wisp: cfg.wisp });
    await transport.init();

    setStatus("Initializing Scramjet controller…");
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

$("back").addEventListener("click", () => frame?.back?.());
$("forward").addEventListener("click", () => frame?.forward?.());
$("reload").addEventListener("click", () => frame?.reload?.());

init();
