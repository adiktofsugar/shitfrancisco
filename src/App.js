import { useMachine } from "@xstate/react";
import PostList from "./posts/PostList";
import UserInfo from "./users/UserInfo";
import UserContext from "./users/UserContext";
import { assign, createMachine, fromPromise } from "xstate";
import userBootActor from "./users/bootActor";
import { Global, css } from "@emotion/react";
import stickerbomb from "./media/stickerbomb.jpg";
import logo from "./media/logo.png";

const machine = createMachine({
  id: "app",
  context: {
    user: /** @type {import("./users/UserContext").UserContext} */ (null),
    error: null,
  },
  initial: "boot",
  states: {
    boot: {
      invoke: {
        src: userBootActor,
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
        onDone: {
          target: "ready",
          actions: assign({
            user: ({ event }) => event.output,
          }),
        },
      },
    },
    error: {
      tags: ["error"],
    },
    ready: {
      tags: ["ready"],
      invoke: {
        src: fromPromise(({ input: user }) =>
          user
            ? new Promise((resolve) => {
                setTimeout(resolve, user.expiration - Date.now());
              })
            : Promise.resolve()
        ),
        input: ({ context }) => context.user,
        onDone: {
          actions: assign({
            user: null,
          }),
        },
      },
    },
  },
});

export default function App() {
  const [state] = useMachine(machine);
  if (state.hasTag("error")) {
    const error = state.context.error;
    return (
      <div>
        {error.message.split(/\n\n/g).map((m) => (
          <p>{m}</p>
        ))}
      </div>
    );
  }
  if (state.hasTag("ready")) {
    return (
      <UserContext.Provider value={state.context.user}>
        <Global
          styles={css`
            body {
              background: url("${stickerbomb}") #000;
              margin: 0;
              padding: 0;
              color: #333;
            }
          `}
        />
        <div>
          <div
            css={css`
              font-family: "Helvetica Neue", Helvetica, sans-serif;
              font-size: 35px;
              background: rgba(0, 0, 0, 0.8);
              padding: 10px;
              float: right;
              position: relative;
            `}
          >
            <img
              css={css`
                max-width: 100%;
              `}
              src={logo}
              alt="Shit Francisco Says"
            />
          </div>
          <UserInfo />

          <div
            css={css`
              clear: right;
              padding-top: 10px;
            `}
          >
            <PostList />
          </div>
        </div>
      </UserContext.Provider>
    );
  }
  return null;
}
