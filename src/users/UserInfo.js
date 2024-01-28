import { useContext } from "react";
import UserContext from "./UserContext";
import { loginUrl, logoutUrl } from "./urls";
import loginIcon from "../media/login-icon.svg";
import logoutIcon from "../media/logout-icon.svg";
import { css } from "@emotion/react";

export default function UserInfo() {
  const user = useContext(UserContext);
  const linkCss = css`
    display: inline-block;
    background: rgba(255, 132, 0, 0.8);
    border-radius: 0 0 5px 0;
    padding: 0.3rem;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    &:visited {
      color: #333;
    }
  `;
  return (
    <div>
      {user ? (
        <a
          title="Log Out"
          css={linkCss}
          href={logoutUrl.href}
          dangerouslySetInnerHTML={{ __html: logoutIcon }}
        />
      ) : (
        <a
          title="Log In"
          css={linkCss}
          href={loginUrl.href}
          dangerouslySetInnerHTML={{ __html: loginIcon }}
        />
      )}
    </div>
  );
}
