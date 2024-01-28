import { CLIENT_ID, DOMAIN } from "./api";

// https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html
const loginUrl = new URL(`https://${DOMAIN}/oauth2/authorize`);
loginUrl.searchParams.set("response_type", "token");
loginUrl.searchParams.set("client_id", CLIENT_ID);
// loginUrl.searchParams.set("scope", "aws.cognito.signin.user.admin");
// loginUrl.searchParams.set("scope", "openid");
loginUrl.searchParams.set(
  "redirect_uri",
  new URL("/auth/sign-in", window.location.href).href,
);

// https://docs.aws.amazon.com/cognito/latest/developerguide/logout-endpoint.html
const logoutUrl = new URL(`https://${DOMAIN}/logout`);
logoutUrl.searchParams.set("client_id", CLIENT_ID);
logoutUrl.searchParams.set(
  "logout_uri",
  new URL("/auth/sign-out", window.location.href).href,
);

export { loginUrl, logoutUrl };
