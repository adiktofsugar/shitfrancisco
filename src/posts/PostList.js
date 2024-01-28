import { assign, createMachine, fromPromise } from "xstate";
import api from "./api";
import PostItem from "./PostItem";
import PostNew from "./PostNew";
import { useMachine } from "@xstate/react";
import { useContext } from "react";
import UserContext from "../users/UserContext";
import { css } from "@emotion/react";

/**
 * @typedef {object} MachineContext
 * @property {Error?} error
 * @property {Awaited<ReturnType<api['fetchAll']>>?} data
 * @property {string?} token
 */

/**
 * @typedef {object} MachineTypes
 * @property {MachineContext} context
 * @property {(
 *  { type: 'removeItem', payload: string } |
 *  { type: 'addItem', payload: import("./api").Post} |
 *  { type: 'retry' }
 * )} events
 */

const machine = createMachine({
  types: /** @type {MachineTypes} */ ({}),
  id: "posts-list",
  initial: "loading",
  context: ({ input }) => ({
    token: input.token,
    error: null,
    data: null,
  }),
  states: {
    loading: {
      tags: ["loading"],
      invoke: {
        src: fromPromise(async ({ input }) => api.fetchAll(input.token)),
        input: ({ context }) => ({
          token: context.token,
        }),
        onDone: {
          target: "success",
          actions: assign({
            data: ({ event }) =>
              /** @type {Awaited<ReturnType<api['fetchAll']>>} */ (
                event.output
              ),
          }),
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => /** @type {Error} */ (event.error),
          }),
        },
      },
    },

    error: {
      tags: ["error"],
      on: {
        retry: {
          target: "loading",
          actions: assign({
            error: null,
          }),
        },
      },
    },
    success: {
      tags: ["ready"],
      on: {
        addItem: {
          actions: assign(({ context, event }) => {
            const { data } = context;
            const post = event.payload;
            return {
              data: {
                count: data.count + 1,
                items: [...data.items, post],
              },
            };
          }),
        },
        removeItem: {
          actions: assign(({ context, event }) => {
            const { data } = context;
            const id = event.payload;
            return {
              data: {
                count: data.count - 1,
                items: data.items.filter((item) => item.id !== id),
              },
            };
          }),
        },
      },
    },
  },
});

export default function PostList() {
  const user = useContext(UserContext);
  const [state, send] = useMachine(machine, {
    input: {
      token: user?.token,
    },
  });
  if (state.hasTag("loading")) {
    return <p>Loading</p>;
  }
  if (state.hasTag("error")) {
    const { error } = state.context;
    return (
      <div
        css={css`
          background-color: white;
        `}
      >
        <p>Error</p>
        <pre>{error.message}</pre>
        <button
          onClick={(e) => {
            e.preventDefault();
            send({
              type: "retry",
            });
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  if (state.hasTag("ready")) {
    const { data } = state.context;
    return (
      <div>
        <ul
          css={css`
            display: flex;
            flex-direction: row-reverse;
            flex-wrap: wrap;
            list-style-type: none;
            margin: 0;
            padding: 0;
          `}
        >
          {data.items.map((post) => (
            <li
              key={post.id}
              css={css`
                background: white;
                padding: 1em;
                margin: 0.5em;
              `}
            >
              <PostItem
                post={post}
                onRemove={() => {
                  send({
                    type: "removeItem",
                    payload: post.id,
                  });
                }}
              />
            </li>
          ))}
        </ul>
        <PostNew
          onCreate={(post) => {
            send({ type: "addItem", payload: post });
          }}
        />
      </div>
    );
  }
  return null;
}
