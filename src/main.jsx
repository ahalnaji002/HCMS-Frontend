import { StrictMode } from "react";
import "@/presentation/i18n";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@/presentation/styles/index.css";
import App from "@/app/App.jsx";
import { AuthProvider } from "@/presentation/context/AuthContext.jsx";
import { ThemeProvider } from "@/presentation/context/ThemeContext.jsx";
import { ApplicationServicesProvider } from "@/app/ApplicationServicesProvider";
import applicationServices from "@/app/applicationServices";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ApplicationServicesProvider services={applicationServices}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ApplicationServicesProvider>
    </ThemeProvider>
  </StrictMode>,
);
