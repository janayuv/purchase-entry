# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## CI/CD and Tauri Releases

This template includes a multi-OS CI that runs linting, formatting, typecheck, tests, and Rust checks. It also builds and releases Tauri installers on version tags.

- Workflow: `.github/workflows/ci.yml`
- OS matrix: Ubuntu, macOS, Windows
- Build installers: via npm (`npm run tauri:build`) and via official `tauri-apps/tauri-action`
- Releases: pushing tags like `v1.0.0` creates a draft GitHub Release with installer artifacts.

### Configure signing (optional but recommended)
Set these GitHub repository secrets if you want signed builds:

- `APPLE_ID`: Apple ID email used for notarization
- `APPLE_PASSWORD`: App-specific password for the Apple ID
- `APPLE_TEAM_ID`: Apple Developer Team ID (e.g. ABCD123456)
- `WINDOWS_CERTIFICATE`: Base64-encoded PFX code signing certificate
- `WINDOWS_CERTIFICATE_PASSWORD`: Password for the PFX

These are wired into the `Tauri Build and Release` step in `ci.yml`.

### Trigger a release

- Create and push a tag (examples):
  - Manually: `git tag -a v1.0.0 -m "Release v1.0.0" && git push origin v1.0.0`
  - Using npm script: `npm run release:tag --TAG=v1.0.0`

The workflow will produce a draft release with platform-specific installers.

### Local development

- Build app locally: `npm run tauri:build`
- Run checks locally: `npm run check` (format, lint, typecheck, tests, and Rust checks)

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
