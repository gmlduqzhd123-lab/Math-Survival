import {NEW_WORLDS} from './v3/content-data.js';
export const MAPS = {
      ...NEW_WORLDS,
      forest: {
        name: "연산의 숲",
        worldW: 2800,
        worldH: 1900,
        base: "#12351f",
        grid: "rgba(187,247,208,.13)",
        accent: "#22c55e",
        accent2: "#86efac",
        deco: ["🌲", "🍄", "🌿", "🪵", "🍀"]
      },
      desert: {
        name: "분수 사막",
        worldW: 3000,
        worldH: 2050,
        base: "#4a2f11",
        grid: "rgba(254,243,199,.13)",
        accent: "#f59e0b",
        accent2: "#fde68a",
        deco: ["🌵", "🪨", "🏺", "☀️", "🔶"]
      },
      library: {
        name: "별빛 도서관",
        worldW: 2850,
        worldH: 2000,
        base: "#111849",
        grid: "rgba(191,219,254,.14)",
        accent: "#818cf8",
        accent2: "#c4b5fd",
        deco: ["📚", "⭐", "🕯️", "🔖", "📐"]
      }
    };
