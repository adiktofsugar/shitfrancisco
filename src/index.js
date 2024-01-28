import ReactDOM from "react-dom/client";
import App from "./App";

let el = document.getElementById("root");
if (!el) {
  el = document.createElement("div");
  el.id = "root";
  document.body.appendChild(el);
}

ReactDOM.createRoot(el).render(<App />);
