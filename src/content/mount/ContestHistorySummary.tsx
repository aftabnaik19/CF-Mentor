import ContestHistorySummary from "../components/ContestHistorySummary/index.tsx";
import { mountComponent, unmountComponent } from "../utils/ComponentUtils.tsx";

const CONTAINER_ID = "cf-mentor-contest-history-summary-host";

function isProfilePage(url: string): boolean {
  return /^https:\/\/codeforces\.com\/profile\//.test(url);
}

export function mountContestHistorySummary() {
  if (!isProfilePage(window.location.href)) return;
  if (document.getElementById(CONTAINER_ID)) return;

  // Prefer main content area if available
  const pageContent = document.querySelector("#pageContent") as HTMLElement | null;
  const target = pageContent ?? document.body;

  const host = document.createElement("div");
  host.id = CONTAINER_ID;
  // Style to blend in CF layout
  host.style.display = "block";
  host.style.margin = "16px 0";
  target.prepend(host);

  const shadowRoot = host.attachShadow({ mode: "open" });
  const shadowMount = document.createElement("div");
  shadowRoot.appendChild(shadowMount);

  mountComponent(shadowMount, <ContestHistorySummary />);
}

export function unmountContestHistorySummary() {
  const host = document.getElementById(CONTAINER_ID) as HTMLElement | null;
  if (!host) return;
  if (host.shadowRoot?.firstElementChild) {
    unmountComponent(host.shadowRoot.firstElementChild as HTMLElement);
  }
  host.remove();
}
