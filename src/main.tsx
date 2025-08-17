import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "./components/theme/ThemeProvider";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <HashRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </HashRouter>
    </ThemeProvider>
  </StrictMode>,
);
