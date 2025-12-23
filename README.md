# TaskFlow 🎯# React + TypeScript + Vite



Ein schlankes, kostenloses Projektmanagement-Tool mit Fokus auf visuelle Aufgabenverwaltung via Kanban-Board.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## Features ✨Currently, two official plugins are available:



### Core Funktionen (MVP)- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- **Kanban-Board** - Visuelle Workflow-Darstellung mit Drag & Drop- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- **Anpassbare Spalten** - Flexible Benennung für jeden Workflow

- **Aufgaben-Cards** - Minimalistisches Design mit allen wichtigen Infos## React Compiler

- **Deadline-Ampel** - 🟢 Grün (>3 Tage), 🟡 Gelb (1-3 Tage), 🔴 Rot (heute/überfällig)

- **Tags-System** - Farbige Labels zur Kategorisierung mit globaler FarbverwaltungThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

- **LocalStorage** - Alles wird automatisch gespeichert, keine Registrierung nötig

## Expanding the ESLint configuration

### UI/UX Features

- **Apple-Style Design** - Moderne rounded corners, Glassmorphism, sanfte SchattenIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

- **Sidebar Navigation** - Burger-Menu mit Dashboard, Boards & Einstellungen

- **Offcanvas Details** - Vollständige Aufgabenbearbeitung ohne Overlay```js

- **Drop-Zone Visualisierung** - Dezente Hervorhebung beim Drag & Dropexport default defineConfig([

- **Inline-Editing** - Schnelles Erstellen und Umbenennen  globalIgnores(['dist']),

  {

## Tech Stack 🛠️    files: ['**/*.{ts,tsx}'],

    extends: [

- **React** + **TypeScript** - Komponentenbasiert und typsicher      // Other configs...

- **Vite** - Schneller Dev-Server und Build-Tool

- **Tailwind CSS** - Utility-first Styling      // Remove tseslint.configs.recommended and replace with this

- **@dnd-kit** - Native Drag & Drop Support      tseslint.configs.recommendedTypeChecked,

- **Lucide React** - Moderne Icon-Bibliothek      // Alternatively, use this for stricter rules

- **LocalStorage API** - Persistierung ohne Backend      tseslint.configs.strictTypeChecked,

      // Optionally, add this for stylistic rules

## Installation & Start 🚀      tseslint.configs.stylisticTypeChecked,



```bash      // Other configs...

# Dependencies installieren    ],

npm install    languageOptions: {

      parserOptions: {

# Development Server starten        project: ['./tsconfig.node.json', './tsconfig.app.json'],

npm run dev        tsconfigRootDir: import.meta.dirname,

      },

# Production Build      // other options...

npm run build    },

```  },

])

Die App läuft auf **http://localhost:5173/**```



## Projektstruktur 📁You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:



``````js

src/// eslint.config.js

├── components/import reactX from 'eslint-plugin-react-x'

│   ├── Board.tsx          # Hauptkomponente mit Drag & Dropimport reactDom from 'eslint-plugin-react-dom'

│   ├── Column.tsx         # Spalten-Container

│   ├── TaskCard.tsx       # Aufgaben-Karteexport default defineConfig([

│   ├── TaskDetail.tsx     # Offcanvas für Details  globalIgnores(['dist']),

│   ├── TagInput.tsx       # Tag-Verwaltung  {

│   └── Sidebar.tsx        # Navigation    files: ['**/*.{ts,tsx}'],

├── utils/    extends: [

│   ├── storage.ts         # LocalStorage Logik      // Other configs...

│   ├── helpers.ts         # Deadline-Status & Formatierung      // Enable lint rules for React

│   └── tagColors.ts       # Tag-Farbdefinitionen      reactX.configs['recommended-typescript'],

├── types.ts               # TypeScript Typen      // Enable lint rules for React DOM

└── App.tsx                # App-Entry      reactDom.configs.recommended,

```    ],

    languageOptions: {

## Nutzung 📝      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

### Aufgaben erstellen        tsconfigRootDir: import.meta.dirname,

1. Klick auf "+ Aufgabe" in einer Spalte      },

2. Titel eingeben und Enter drücken      // other options...

3. Auf Aufgabe klicken für Details    },

  },

### Tags hinzufügen])

1. Aufgabe öffnen```

2. Tag-Name eingeben und Komma drücken
3. Auf Tag klicken → Farbauswahl öffnet sich
4. Farbe wählen (gilt global für alle Tasks mit diesem Tag)

### Spalten anpassen
1. Doppelklick auf Spaltenname zum Umbenennen
2. Drei-Punkte-Menü für Optionen
3. "+ Neue Spalte" für weitere Workflows

## Roadmap 🗺️

- [ ] Filter & Suche
- [ ] WIP-Limits
- [ ] Swimlanes
- [ ] Attachments
- [ ] Kommentare
- [ ] Multi-Board Support
- [ ] Export/Import (JSON)
- [ ] Dark Mode

## Lizenz 📄

MIT License - Frei nutzbar für private und kommerzielle Projekte

## Autor 👨‍💻

**TaskFlow** - Ein modernes Kanban-Tool für produktive Teams

---

Made with ❤️ and React
