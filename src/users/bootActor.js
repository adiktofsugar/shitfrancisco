/** @typedef {import('./UserContext').UserContext} UserContext */
import { fromPromise } from "xstate";
import getLoginErrorMessage from "./getLoginErrorMessage";

export default fromPromise(async () => {
  const url = new URL(location.href);
  if (url.pathname === "/auth/sign-in") {
    const {
      expires_in: expiresIn,
      id_token: token,
      error,
      error_description: errorDescription,
    } = getLoginParams();
    if (error) {
      const e = new Error(
        [getLoginErrorMessage(error), getLoginErrorMessage(errorDescription)]
          .filter(Boolean)
          .join("\n\n")
      );
      throw e;
    }
    const expiresInMs = parseInt(expiresIn, 10) * 1000;
    const expiration = Date.now() + expiresInMs;
    const user = {
      token,
      expiration,
    };
    localStorage.setItem("token", JSON.stringify(user));
  } else if (url.pathname === "/auth/sign-out") {
    localStorage.removeItem("token");
  }
  history.replaceState(null, "", "/");
  const existing = localStorage.getItem("token");
  if (existing) {
    return /** @type {UserContext} */ (JSON.parse(existing));
  }
  return null;
});

function getLoginParams() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return {
    error: params.get("error"),
    error_description: params.get("error_description"),
    id_token: params.get("id_token"),
    expires_in: params.get("expires_in"),
  };
}
