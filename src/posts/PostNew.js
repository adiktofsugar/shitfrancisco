import { useContext, useRef } from "react";
import PropTypes from "prop-types";
import { assign, createMachine, fromPromise } from "xstate";
import api from "./api";
import UserContext from "../users/UserContext";
import { useMachine } from "@xstate/react";
import { css } from "@emotion/react";

/**
 * @typedef {object} MachineInput
 * @property {import("../users/UserContext").UserContext} user
 * @property {(post:import("./api").Post)=>any} onCreate
 */

/**
 * @typedef {object} MachineContext
 * @property {import("../users/UserContext").UserContext} user
 * @property {Error?} error
 * @property {string?} pendingMessage
 * @property {(post:import("./api").Post)=>any} onCreate
 */

/**
 * @typedef {object} MachineTypes
 * @property {MachineInput} input
 * @property {MachineContext} context
 * @property {{ type: 'submit', payload: string }} events
 */

const machine = createMachine({
  types: /** @type {MachineTypes} */ ({}),
  id: "posts-new",
  initial: "idle",
  context: ({ input }) => ({
    user: input.user,
    onCreate: input.onCreate,
    error: null,
    pendingMessage: null,
  }),
  states: {
    idle: {
      tags: ["ready"],
      on: {
        submit: {
          target: "creating",
          actions: assign({
            pendingMessage: ({ event }) => event.payload,
          }),
        },
      },
    },
    creating: {
      tags: ["loading"],
      invoke: {
        src: fromPromise(({ input }) =>
          api.create(input.token, { message: input.message })
        ),
        input: ({ context, event }) => ({
          token: context.user.token,
          message: event.payload,
        }),
        onDone: {
          target: "idle",
          actions: ({ context, event }) => {
            context.onCreate(event.output);
          },
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
    },
  },
});

/** @param {import("prop-types").InferProps<PostNew['propTypes']>} props */
export default function PostNew({ onCreate }) {
  const user = useContext(UserContext);
  const [state, send] = useMachine(machine, {
    input: {
      user,
      onCreate,
    },
  });
  const textareaRef = /** @type {typeof useRef<HTMLTextAreaElement>} */ (
    useRef
  )();
  /** @type {React.FormEventHandler<HTMLFormElement>} */
  function handleFormSubmit(e) {
    e.preventDefault();
    const val = textareaRef.current.value;
    textareaRef.current.value = "";
    send({ type: "submit", payload: val });
  }
  if (!user) {
    return null;
  }
  if (state.hasTag("error")) {
    const { error } = state.context;
    return (
      <div
        css={css`
          background-color: white;
        `}
      >
        <h3>{error.message}</h3>
        <pre>{error.stack}</pre>
      </div>
    );
  }
  if (state.hasTag("ready") || state.hasTag("loading")) {
    const isLoading = state.hasTag("loading");
    return (
      <form onSubmit={handleFormSubmit}>
        <textarea
          placeholder="New shit francisco just said"
          ref={textareaRef}
          disabled={isLoading}
          name="message"
          css={css`
            outline: none;
            width: 100%;
            box-sizing: border-box;
            min-height: 7em;
            border: 1px solid #aaa;
            color: #aaa;
            padding: 0.3em;
            opacity: 0.6;
            &:focus {
              color: #000;
              opacity: 1;
            }
          `}
        />
        <button
          type="submit"
          disabled={isLoading}
          css={css`
            border: none;
            background: #fa0;
            padding: 0.5em;
            color: white;
            font-size: 20px;
            cursor: pointer;
            &:focus,
            &:hover {
              background: #e90;
            }
          `}
        >
          Add new Francisco nonsense
        </button>
      </form>
    );
  }
  return null;
}

PostNew.propTypes = {
  onCreate: PropTypes.func.isRequired,
};
