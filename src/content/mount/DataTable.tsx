import ProblemDataTable from "../components/datatable/DataTable";
import { mountComponent, unmountComponent } from "../utils/ComponentUtils.tsx";

const CONTAINER_ID = "cf-mentor-datatable";
const SHADOW_MOUNT_ID = "cf-mentor-datatable-shadow-mount";

let originalContent: string | null = null;
let originalStyle: string | null = null;
let originalClassName: string | null = null;
const paginationDiv = document.querySelector(".pagination") as HTMLElement | null;

function injectStylesIntoShadow(shadowRoot: ShadowRoot) {
  const links = [
    // PrimeReact theme and core CSS (scoped inside shadow)
    "https://cdn.jsdelivr.net/npm/primereact@10.9.6/resources/themes/lara-light-indigo/theme.css",
    "https://cdn.jsdelivr.net/npm/primereact@10.9.6/resources/primereact.min.css",
    // PrimeIcons (for sort/resizer icons)
    "https://cdn.jsdelivr.net/npm/primeicons@7.0.0/primeicons.css",
  ];
  for (const href of links) {
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
    if (paginationDiv) paginationDiv.style.display = "none";

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
  if (paginationDiv) {
    paginationDiv.style.display = "block";
  }
}
