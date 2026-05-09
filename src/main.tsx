import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles.css";

const queryClient = new QueryClient();
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

function MissingClerkConfig() {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-mark">SF</div>
        <h1>Access Control Not Configured</h1>
        <p>Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> in Vercel and locally to enable approved-email access.</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {clerkPublishableKey ? (
        <ClerkProvider publishableKey={clerkPublishableKey}>
          <App />
        </ClerkProvider>
      ) : (
        <MissingClerkConfig />
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);
