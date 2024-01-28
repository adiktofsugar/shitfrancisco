import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { v5 as uuid } from "uuid";

const region = "us-west-1";
const identityPoolId = "us-west-1:4435fa30-f530-4e05-8232-64ee2d6d70e5";
const userPoolId = "us-west-1_sKLeujudl";
const POST_NAMESPACE = "dc78f8f6-c557-4077-913c-362e826224e4";

/**
 * @typedef {object} Post
 * @property {string} id
 * @property {string} message
 * @property {number} date
 */

const getCredentialsProvider = (cognitoIdToken) => {
  /** @type {Parameters<fromCognitoIdentityPool>[0]} */
  const input = {
    identityPoolId,
    clientConfig: { region },
    logins: cognitoIdToken
      ? {
          // https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-integrating-user-pools-with-identity-pools.html
          // In the Integrating a user pool with an identity pool section
          [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: cognitoIdToken,
        }
      : {},
  };
  return fromCognitoIdentityPool(input);
};

/** @type {Record<string,DynamoDBClient>} */
const clientsByToken = {};
/** @type {Record<string,DynamoDBDocumentClient>} */
const ddoClientsByToken = {};

function getClient(token) {
  if (!clientsByToken[token]) {
    clientsByToken[token] = new DynamoDBClient({
      region,
      credentials: getCredentialsProvider(token),
    });
  }
  return clientsByToken[token];
}

/**
 *
 * @param {string} token
 */
function getDdoClient(token) {
  if (!ddoClientsByToken[token]) {
    const client = getClient(token);
    ddoClientsByToken[token] = DynamoDBDocumentClient.from(client);
  }
  return ddoClientsByToken[token];
}

const TableName = "shitfrancisco-posts";

/**
 *
 * @param {string} token
 * @returns {Promise<{count:number,items:Post[]}>}
 */
async function fetchAll(token) {
  const ddoClient = getDdoClient(token);
  const { Count, Items } = await ddoClient.send(new ScanCommand({ TableName }));
  const items = /** @type {Post[]} */ (Items);
  return {
    count: Count,
    items: items.sort((a, b) => {
      if (a.date === b.date) return 0;
      return a.date > b.date ? 1 : -1;
    }),
  };
}

/**
 *
 * @param {string} token
 * @param {{message:string}} param
 * @returns {Promise<Post>}
 */
async function create(token, { message }) {
  const id = uuid(message, POST_NAMESPACE);
  const ddoClient = getDdoClient(token);
  const date = Date.now();
  const post = { id, message, date };
  await ddoClient.send(
    new PutCommand({
      Item: post,
      TableName,
    })
  );
  return post;
}

/**
 *
 * @param {string} token
 * @param {{id:string}} params
 */
async function remove(token, { id }) {
  const ddoClient = getDdoClient(token);
  await ddoClient.send(
    new DeleteCommand({
      TableName,
      Key: { id },
    })
  );
  return id;
}

export default { fetchAll, create, remove };
