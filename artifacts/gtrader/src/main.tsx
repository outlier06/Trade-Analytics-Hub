// Apply saved theme before React renders to prevent flash
const saved = localStorage.getItem("outlier-theme") ?? "dark";
document.documentElement.classList.toggle("dark", saved === "dark");

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
