import ContestHistorySummary from "../components/ContestHistorySummary/index.tsx";
import { mountComponent, unmountComponent } from "../utils/ComponentUtils.tsx";

const BTN_ID = "cf-mentor-stalk-btn";
const MODAL_ID = "cf-mentor-stalk-modal";

function isProfilePage(url: string): boolean {
  return /^https:\/\/codeforces\.com\/profile\//.test(url);
}

/**
 * Try to locate the horizontal profile links bar and append our Stalk button there.
 * Fallbacks: append near #pageContent header if menu not found.
 */
function findProfileMenuContainer(): HTMLUListElement | null {
  // Prefer the UL.list that holds the tabs
  const direct = document.querySelector("#pageContent .second-level-menu-list") as HTMLUListElement | null;
  if (direct) return direct;
  const wrapper = document.querySelector("#pageContent .second-level-menu") as HTMLElement | null;
  if (wrapper) {
    const ul = wrapper.querySelector(".second-level-menu-list") as HTMLUListElement | null;
    if (ul) return ul;
  }
  // Broader fallbacks for different CF layouts
  const any = document.querySelector(".second-level-menu-list") as HTMLUListElement | null;
  if (any) return any;
  return null;
}

function ensureModalHost(): { host: HTMLElement; mountPoint: HTMLElement } {
  let host = document.getElementById(MODAL_ID) as HTMLElement | null;
  if (!host) {
    host = document.createElement("div");
    host.id = MODAL_ID;
    document.body.appendChild(host);
  }
  // Reuse existing shadow root if present
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  // Ensure a single style tag
  if (!shadow.querySelector("style[data-cf-mentor-stalk]")) {
    const s = styleTag();
    s.setAttribute("data-cf-mentor-stalk", "");
    shadow.appendChild(s);
  }
  // Ensure a dedicated mount point
  let mountPoint = shadow.getElementById("cfm-mount") as HTMLElement | null;
  if (!mountPoint) {
    mountPoint = document.createElement("div");
    mountPoint.id = "cfm-mount";
    shadow.appendChild(mountPoint);
  }
  return { host, mountPoint };
}

function styleTag() {
  const style = document.createElement("style");
  style.textContent = `
  .cfm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 2147483000; display: flex; align-items: center; justify-content: center; }
  .cfm-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; width: min(960px, 95vw); max-height: 90vh; overflow: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
  .cfm-header { display:flex; align-items:center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-weight: 600; }
  .cfm-close { background:none; border:none; font-size:14px; cursor:pointer; color:#374151; }
  .cfm-body { padding: 8px; }
  .cfm-btn { display:inline-block; padding: 3px 10px; border-radius: 12px; background: #111; color:#fff; font-weight: 600; cursor: pointer; margin-left: 8px; }
  .cfm-btn:hover { filter: brightness(1.1); }
  `;
  return style;
}

function openModal() {
  const { mountPoint } = ensureModalHost();
  // Build modal DOM outside React for simple overlay structure
  const overlay = document.createElement("div");
  overlay.className = "cfm-overlay";
  const dialog = document.createElement("div");
  dialog.className = "cfm-card";
  const header = document.createElement("div");
  header.className = "cfm-header";
  header.innerHTML = `<span>Stalk • Contest History Summary</span>`;
  const close = document.createElement("button");
  close.className = "cfm-close";
  close.textContent = "Close";
  close.addEventListener("click", () => closeModal());
  header.appendChild(close);
  const body = document.createElement("div");
  body.className = "cfm-body";
  const reactMount = document.createElement("div");
  body.appendChild(reactMount);
  dialog.appendChild(header);
  dialog.appendChild(body);
  overlay.appendChild(dialog);
  mountPoint.replaceChildren(overlay);

  // ESC to close
  const esc = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
  document.addEventListener("keydown", esc, { once: true });

  // Click outside to close
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

  // Mount React content
  mountComponent(reactMount, <ContestHistorySummary />);
}

function closeModal() {
  const host = document.getElementById(MODAL_ID) as HTMLElement | null;
  if (!host || !host.shadowRoot) return;
  const mountPoint = host.shadowRoot.getElementById("cfm-mount") as HTMLElement | null;
  if (!mountPoint) return;
  const reactMount = mountPoint.querySelector(".cfm-card .cfm-body > div") as HTMLElement | null;
  if (reactMount) {
    unmountComponent(reactMount);
  }
  mountPoint.replaceChildren();
}

export function mountStalkButtonAndPanel() {
  if (!isProfilePage(window.location.href)) return;
  if (document.getElementById(BTN_ID)) return;
  const menu = findProfileMenuContainer();
  if (!menu) return;

  // Build <li><a> like CF menu
  const anchor = document.createElement("a");
  anchor.id = BTN_ID;
  anchor.textContent = "STALK";
  anchor.href = "#";
  // Match CF menu: anchors inside li inherit styles; no extra classes needed
  anchor.removeAttribute("class");
  anchor.addEventListener("click", (e) => { e.preventDefault(); openModal(); });

  // Insert as a list item in the UL so CF CSS applies identically
  const li = document.createElement("li");
  li.appendChild(anchor);
  menu.appendChild(li);
}

export function unmountStalkButtonAndPanel() {
  const btn = document.getElementById(BTN_ID);
  if (btn) btn.remove();
  const host = document.getElementById(MODAL_ID) as HTMLElement | null;
  if (host) host.remove();
}
