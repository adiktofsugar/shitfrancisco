const ERROR_MAP = {
  invalid_request: `The request is missing a required parameter, includes an unsupported parameter value (other than unsupported_grant_type), or is otherwise malformed. For example, grant_type is refresh_token but refresh_token is not included.`,
  invalid_client: `Client authentication failed. For example, when the client includes client_id and client_secret in the authorization header, but there's no such client with that client_id and client_secret.`,
  invalid_grant: `
      Refresh token has been revoked.
  
      Authorization code has been consumed already or does not exist.
  
      App client doesn't have read access to all attributes in the requested scope. For example, your app requests the email scope and your app client can read the email attribute, but not email_verified.
    `,
  unauthorized_client: `Client is not allowed for code grant flow or for refreshing tokens.`,
  unsupported_grant_type: `grant_type is anything other than authorization_code or refresh_token or client_credentials.`,
};

export default function getLoginErrorMessage(error) {
  return ERROR_MAP[error] ? `${error}: ${ERROR_MAP[error]}` : error;
}
