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
/* Codeforces-inspired Modern styles */
.cfm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "verdana", "arial", sans-serif;
}

.cfm-card {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  width: min(960px, 95vw);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  color: #1f2937;
  font-size: 13px;
  animation: cfm-fade-in 0.2s ease-out;
}

@keyframes cfm-fade-in {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

.cfm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.cfm-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.cfm-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cfm-close:hover {
  color: #111827;
  background: #e5e7eb;
}

.cfm-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* Controls */
.cfm-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  background: #fff;
  padding: 4px 0;
}

.cfm-control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cfm-label {
  color: #4b5563;
  font-weight: 500;
  font-size: 13px;
}

.cfm-input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  width: 60px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.cfm-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Toggle Buttons (Segmented Control) */
.cfm-toggle-group {
  display: flex;
  border: 1px solid #ccc;
  border-radius: 3px;
  overflow: hidden;
}

.cfm-toggle-btn {
  background: #fff;
  border: none;
  border-right: 1px solid #ccc;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  transition: background 0.2s;
}

.cfm-toggle-btn:last-child {
  border-right: none;
}

.cfm-toggle-btn:hover {
  background: #f5f5f5;
}

.cfm-toggle-btn.active {
  background: #e0e0e0;
  font-weight: bold;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}

/* Table */
.cfm-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.cfm-table th {
  text-align: left;
  padding: 10px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  font-weight: 600;
  font-size: 13px;
  /* Removed text-transform: uppercase */
}

.cfm-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #1f2937;
  transition: background 0.15s;
}

.cfm-table tr:last-child td {
  border-bottom: none;
}

.cfm-table tr.expandable {
  cursor: pointer;
}

.cfm-table tr.expandable:hover td {
  background: #f0f9ff;
}

.cfm-table .numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Subtable */
.cfm-subtable-container {
  background: #f8fafc;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.cfm-subtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.cfm-subtable th, .cfm-subtable td {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.cfm-subtable th {
  background: #f3f4f6;
  color: #4b5563;
  font-weight: 600;
}

.cfm-subtable .row-label {
  text-align: left;
  font-weight: normal; /* Removed bold */
  background: #f9fafb;
  color: #374151;
  width: 140px;
}

.cfm-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  font-size: 10px;
  color: #9ca3af;
  transition: transform 0.2s, color 0.2s;
}

.cfm-table tr.expandable:hover .cfm-chevron {
  color: #3b82f6;
}

.cfm-chevron.expanded {
  transform: rotate(90deg);
  color: #3b82f6;
}

.cfm-note {
  font-size: 12px;
  color: #6b7280;
  margin-top: 12px;
  font-style: italic;
}
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
  header.innerHTML = `<span class="cfm-title">Stalk • Contest History Summary</span>`;
  const close = document.createElement("button");
  close.className = "cfm-close";
  // SVG Cross Icon
  close.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L1 13M1 1L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
