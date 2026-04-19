"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      // Optional: Auto-detect system preference
      // document.documentElement.setAttribute("data-theme", "dark");
      // setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        width: "100%",
        borderRadius: "12px",
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        color: "var(--text-main)",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginBottom: "1rem"
      }}
      className="hoverable-link"
    >
      {theme === "light" ? (
        <><Moon size={18} color="var(--primary)" /> Modo Oscuro</>
      ) : (
        <><Sun size={18} color="#FBBF24" /> Modo Claro</>
      )}
    </button>
  );
}
