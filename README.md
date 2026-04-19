# Think-Tanks-DC: Macro-Analysis Dashboard

This project provides a systems-level macro analysis of the epistemic community in Washington, D.C. It utilizes D3.js and React to visualize complex relationships concerning funding sources, personnel networks, and ideological trends across 75 think tanks.

## Data Schema
The analysis relies on structured datasets mapped in `src/data/types.ts`:
* `ThinkTank`: Core entity tracking ideological leaning, personnel, transparency scores, and funding categorizations (e.g., Pentagon, Foreign Gov, Dark Money).
* `Transaction`: Records discrete financial flows linking donors to think tanks.
* `RevolvingDoorEntry`: Tracks individual transitions between government agencies, lobbying firms, and think tanks to map network centrality.

## Analytical Framework
The dashboard employs multiple visual frameworks to analyze systemic influence:
* **Foreign Government Flows (Chord):** Maps dependencies and major funding channels from sovereign entities.
* **Funding Concentration (Heatmap):** Assesses the distribution of disclosed versus undisclosed ("Dark Money") capital across the sector.
* **Revolving Door Network (Network Graph):** Analyzes shared personnel to reveal clusters of institutional influence and cross-pollination.
* **Money Flows (Sankey):** Traces the volume and pathways of financial support from broad donor types to specific institutions.
* **Ideology & Funding (Treemap/Timeline):** Correlates ideological alignment with establishment trends and total capital deployment.

For Methodolody (link)
https://docs.google.com/document/d/1kYJblAn-Q3YRhWEeDEOo69iDG5H4nCEhopisjMhg7eI/edit?usp=sharing

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
