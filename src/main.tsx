import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initCloudSync } from "@/lib/cloudSync";

// Cloud-Sync starten (zieht Patient:innen/Sessions/Decks aus der Cloud
// und spiegelt lokale Änderungen wieder zurück).
initCloudSync().catch(err => console.warn("[main] initCloudSync failed", err));

createRoot(document.getElementById("root")!).render(<App />);
