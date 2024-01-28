import { css } from "@emotion/react";
import PropTypes from "prop-types";
import { Post } from "./shapes";
import { useContext, useEffect } from "react";
import UserContext from "../users/UserContext";
import { assign, createMachine, fromPromise } from "xstate";
import api from "./api";
import deleteIcon from "../media/delete-icon.svg";
import { format } from "date-fns/format";
import { useMachine } from "@xstate/react";

/**
 * @typedef {object} MachineInput
 * @property {import("../users/UserContext").UserContext} user
 * @property {string} id
 * @property {()=>any} onRemove
 */

/**
 * @typedef {object} MachineContext
 * @property {string?} token
 * @property {string} id
 * @property {Error} [error]
 * @property {()=>any} onRemove
 */

const fromRemovePromise =
  /** @type {typeof fromPromise<Awaited<ReturnType<api['remove']>>,MachineContext>} */ (
    fromPromise
  );

const machine = createMachine({
  types: {
    input: /** @type {MachineInput} */ (null),
    context: /** @type {MachineContext} */ (null),
  },
  id: "post-item",
  initial: "loaded",
  context: ({ input }) => ({
    token: input.user?.token,
    id: input.id,
    onRemove: input.onRemove,
  }),
  states: {
    loaded: {
      tags: ["ready"],
      on: {
        remove: "removing",
      },
    },
    removing: {
      tags: ["loading"],
      invoke: {
        src: fromRemovePromise(({ input }) =>
          api.remove(input.token, { id: input.id })
        ),
        input: ({ context }) => context,
        onDone: {
          target: "removed",
        },
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => /** @type {Error} */ (event.error),
          }),
        },
      },
    },
    removed: {
      type: "final",
      entry: ({ context }) => {
        context.onRemove();
      },
    },
    error: {
      tags: ["error"],
      on: {
        retry: {
          target: "removing",
          actions: assign({
            error: null,
          }),
        },
      },
    },
  },
});

/** @param {import("prop-types").InferProps<PostItem['propTypes']>} props */
export default function PostItem({ post, onRemove }) {
  const user = useContext(UserContext);
  const [state, send] = useMachine(machine, {
    input: {
      user,
      id: post.id,
      onRemove,
    },
  });
  const handleDeleteClick = (e) => {
    e.preventDefault();
    send({
      type: "remove",
    });
  };
  if (state.hasTag("error")) {
    const { error } = state.context;
    return (
      <div>
        <h3>{error.message}</h3>
        <pre>{error.stack}</pre>
      </div>
    );
  } else if (state.hasTag("loading")) {
    return <p>loading</p>;
  } else if (state.hasTag("ready")) {
    return (
      <div>
        <p
          css={css`
            min-width: 250px;
          `}
        >
          {format(new Date(post.date), "E, LLL d, y H:mm O")}
        </p>
        <p>{post.message}</p>
        {user && (
          <div
            css={css`
              display: flex;
              flex-direction: row-reverse;
            `}
          >
            <button
              onClick={handleDeleteClick}
              css={css`
                cursor: pointer;
                border: none;
                background: none;
                padding: 0;
                fill: red;
              `}
              dangerouslySetInnerHTML={{ __html: deleteIcon }}
            />
          </div>
        )}
      </div>
    );
  }
  return null;
}
PostItem.propTypes = {
  post: Post.isRequired,
  onRemove: PropTypes.func.isRequired,
};
