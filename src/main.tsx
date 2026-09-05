import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";

// /track/:token is the customer-facing repair-status page — no offline shell
// needed there, and precaching the entire staff app onto a customer's phone
// would undo the point of code-splitting it away in the first place.
if (!window.location.pathname.startsWith("/track/")) {
  import("virtual:pwa-register")
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {
      // A failed SW registration must never take the app down with it.
    });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);
