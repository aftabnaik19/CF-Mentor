import ProblemDataTable from "../components/datatable/DataTable";
import { mountComponent, unmountComponent } from "../utils/ComponentUtils.tsx";
// Inject project styles into shadow root so custom row classes work
// Vite `?raw` imports file contents as string
import dataTableCss from "../components/datatable/DataTable.css?raw";

const CONTAINER_ID = "cf-mentor-datatable";
const SHADOW_MOUNT_ID = "cf-mentor-datatable-shadow-mount";

let originalContent: string | null = null;
let originalStyle: string | null = null;
let originalClassName: string | null = null;
let originalPaginationDisplay: string | null = null;

function injectStylesIntoShadow(shadowRoot: ShadowRoot) {
  // 1) Project-specific DataTable styles so row classes render inside shadow
  if (dataTableCss && !shadowRoot.querySelector('style[data-cf-mentor-datatable]')) {
    const s = document.createElement("style");
    s.setAttribute("data-cf-mentor-datatable", "");
    s.textContent = dataTableCss;
    shadowRoot.appendChild(s);
  }

  // 2) PrimeReact theme, core CSS and PrimeIcons via CDN for now
  // Note: consider bundling later to avoid CSP/CDN risks
  const links = [
    "https://cdn.jsdelivr.net/npm/primereact@10.9.6/resources/themes/lara-light-indigo/theme.css",
    "https://cdn.jsdelivr.net/npm/primereact@10.9.6/resources/primereact.min.css",
    "https://cdn.jsdelivr.net/npm/primeicons@7.0.0/primeicons.css",
  ];
  for (const href of links) {
    if (shadowRoot.querySelector(`link[rel="stylesheet"][href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    shadowRoot.appendChild(link);
  }
}

function isProblemsetPage(): boolean {
	const { pathname } = window.location;
	return pathname === "/problemset" || pathname === "/problemset/";
}

export function mountDataTable() {
  const targetDiv = document.querySelector(".datatable") as HTMLElement | null;
  const isOnProblemsetPage = isProblemsetPage();
  if (targetDiv && isOnProblemsetPage && !document.getElementById(CONTAINER_ID)) {
    // Store the original content, style and class
    originalContent = targetDiv.innerHTML;
    originalStyle = targetDiv.getAttribute("style");
    originalClassName = targetDiv.className;

    // Hide native pagination if present and remember its previous inline display
    const paginationDiv = document.querySelector(".pagination") as HTMLElement | null;
    if (paginationDiv) {
      originalPaginationDisplay = paginationDiv.style.display || null;
      paginationDiv.style.display = "none";
    }

    // Clear its contents and keep class/style so layout remains consistent
    targetDiv.innerHTML = "";

    // Create a host inside the target and attach shadow root
    const host = document.createElement("div");
    host.id = CONTAINER_ID;
    targetDiv.appendChild(host);

    const shadowRoot = host.attachShadow({ mode: "open" });
    // Inject PrimeReact CSS only inside shadow to avoid global leakage
    injectStylesIntoShadow(shadowRoot);

    // Shadow mount point for React
    const shadowMount = document.createElement("div");
    shadowMount.id = SHADOW_MOUNT_ID;
    shadowRoot.appendChild(shadowMount);

    // Mount the DataTable into the shadow root
    mountComponent(shadowMount, <ProblemDataTable />);
  }
}

export function unmountDataTable() {
  const host = document.getElementById(CONTAINER_ID) as HTMLElement | null;
  if (host) {
    // Unmount React root from shadow if present
    const shadowRoot = host.shadowRoot;
    if (shadowRoot) {
      const shadowMount = shadowRoot.getElementById(SHADOW_MOUNT_ID) as HTMLElement | null;
      if (shadowMount) {
        unmountComponent(shadowMount);
      }
    }
    host.remove();

    // Restore original state
    const targetDiv = document.querySelector(".datatable") as HTMLElement | null;
    if (targetDiv && originalContent !== null) {
      targetDiv.innerHTML = originalContent;
      if (originalStyle !== null) targetDiv.setAttribute("style", originalStyle);
      if (originalClassName !== null) targetDiv.className = originalClassName;
      originalContent = null;
      originalStyle = null;
      originalClassName = null;
    }
  }
  // Restore pagination inline style exactly as before
  const paginationDiv = document.querySelector(".pagination") as HTMLElement | null;
  if (paginationDiv) {
    if (originalPaginationDisplay === null) {
      paginationDiv.style.removeProperty("display");
    } else {
      paginationDiv.style.display = originalPaginationDisplay;
    }
    originalPaginationDisplay = null;
  }
}
