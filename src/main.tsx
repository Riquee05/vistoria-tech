import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { registerPwaInstallPrompt } from "./lib/pwa-install";

registerPwaInstallPrompt();

createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('Não foi possível registrar o PWA:', error);
    });
  });
}
