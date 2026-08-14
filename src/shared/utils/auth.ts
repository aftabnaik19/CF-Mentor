/**
 * Utility to check if a user is logged in to Codeforces.
 * It also supports observing login state changes dynamically.
 */

interface LoginState {
    isLoggedIn: boolean;
    handle: string | null;
}

/**
 * Checks the current login state by inspecting the DOM.
 * Reliance: Matches the specific structure of Codeforces header.
 * - Logged in: Contains a "Logout" link.
 * - Logged out: Usually contains an "Enter" link.
 */
export function getLoginState(): LoginState {
    // The container for login info is typically in `.lang-chooser > div[style="text-align: right;"]`
    // but searching for the logout link globally in the header is robust enough.
    const header = document.querySelector("#header");
    if (!header) {
        return { isLoggedIn: false, handle: null };
    }

    const logoutLink = header.querySelector('a[href*="/logout"]');
    if (logoutLink) {
        // Logged in
        // The handle is usually in the link preceding the logout link or nearby.
        // Structure: <a href="/profile/HANDLE">HANDLE</a> | <a href=".../logout">Logout</a>
        // We can look for a profile link nearby.
        const profileLink = header.querySelector('a[href^="/profile/"]');
        const handle = profileLink ? profileLink.textContent?.trim() || null : null;
        return { isLoggedIn: true, handle };
    }

    return { isLoggedIn: false, handle: null };
}

/**
 * Type of the callback function triggered on state change.
 */
export type LoginStateChangeCallback = (state: LoginState) => void;

/**
 * Sets up a mutation observer to watch for login state changes.
 * This handles cases where Codeforces might update the header dynamically (unlikely but possible)
 * or if the user logs in/out via a modal (if ever implemented) or we just want to be reactive.
 * @param callback Function to call when login state changes (e.g. log in -> log out)
 * @returns Cleanup function to disconnect the observer.
 */
export function onLoginStateChange(
    callback: LoginStateChangeCallback,
): () => void {
    const header = document.querySelector("#header");
    if (!header) {
        console.warn("CF Mentor: Header not found, cannot observe login state.");
        return () => { };
    }

    let lastState = getLoginState();

    const observer = new MutationObserver(() => {
        const newState = getLoginState();
        if (
            newState.isLoggedIn !== lastState.isLoggedIn ||
            newState.handle !== lastState.handle
        ) {
            lastState = newState;
            callback(newState);
        }
    });

    // Observe strict subtree of the header or just the lang chooser if possible to reduce noise.
    // The login div is inside .lang-chooser.
    const target = header.querySelector(".lang-chooser") || header;

    observer.observe(target, {
        childList: true,
        subtree: true,
    });

    return () => observer.disconnect();
}
