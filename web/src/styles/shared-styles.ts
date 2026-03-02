import { css } from 'lit';

export const sharedStyles = css`
  /* ===== CSS Reset for Web Components ===== */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* Reset form elements to inherit font */
  input, button, textarea, select {
    font: inherit;
    color: inherit;
  }

  /* Reset lists */
  ul, ol {
    list-style: none;
  }

  /* Reset links */
  a {
    color: inherit;
    text-decoration: none;
  }

  :host {
    /* ===== Typography ===== */
    --font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-family-mono: 'Roboto Mono', 'SF Mono', 'Monaco', 'Consolas', monospace;

    --font-size-xs: 0.75rem;    /* 12px */
    --font-size-sm: 0.875rem;   /* 14px */
    --font-size-md: 1rem;       /* 16px */
    --font-size-lg: 1.125rem;   /* 18px */
    --font-size-xl: 1.25rem;    /* 20px */
    --font-size-2xl: 1.5rem;    /* 24px */

    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    --line-height-tight: 1.25;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.75;

    /* ===== Colors ===== */
    --tg-primary: #707df1;
    --tg-primary-dark: #5a67d8;
    --tg-secondary: #9e60eb;
    --tg-secondary-dark: #7c3aed;

    /* Surface colors */
    --tg-surface: #ffffff;
    --tg-surface-variant: #f5f5f5;
    --tg-background: #ededed;

    /* Border colors */
    --tg-border: #e0e0e0;
    --tg-border-light: #eeeeee;
    --tg-border-dark: #bdbdbd;

    /* Text colors */
    --tg-text-primary: #212121;
    --tg-text-secondary: #616161;
    --tg-text-tertiary: #9e9e9e;
    --tg-text-inverse: #ffffff;

    /* Header colors */
    --tg-header-bg: #1a1a2e;
    --tg-header-text: #ffffff;
    --tg-header-height: 56px;
    --tg-breadcrumb-separator: #888888;

    /* Link colors */
    --tg-link-color: #707df1;
    --tg-link-hover-color: #5a67d8;

    /* Test status colors */
    --tg-status-pass: #4caf50;
    --tg-status-fail: #f44336;
    --tg-status-broken: #e91e63;
    --tg-status-flaky: #ff9800;
    --tg-status-unknown: #9e9e9e;
    --tg-status-stale: #9e9e9e;
    --tg-status-pending: #2196f3;
    --tg-status-acceptable: #8bc34a;

    /* Material Symbols font */
    --md-icon-font: 'Material Symbols Outlined';

    /* ===== Material Web Component Overrides ===== */
    --md-sys-typescale-body-medium-font: var(--font-family);
    --md-sys-typescale-body-small-font: var(--font-family);
    --md-sys-typescale-label-medium-font: var(--font-family);
    --md-sys-typescale-label-small-font: var(--font-family);
    --md-sys-typescale-title-medium-font: var(--font-family);

    /* ===== Apply Base Styles ===== */
    font-family: var(--font-family);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-normal);
    line-height: var(--line-height-normal);
    color: var(--tg-text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ===== Material Icon Styles ===== */
  md-icon {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: 'liga';
  }

  /* ===== Typography Utility Classes ===== */
  .text-xs { font-size: var(--font-size-xs); }
  .text-sm { font-size: var(--font-size-sm); }
  .text-md { font-size: var(--font-size-md); }
  .text-lg { font-size: var(--font-size-lg); }
  .text-xl { font-size: var(--font-size-xl); }
  .text-2xl { font-size: var(--font-size-2xl); }

  .font-normal { font-weight: var(--font-weight-normal); }
  .font-medium { font-weight: var(--font-weight-medium); }
  .font-semibold { font-weight: var(--font-weight-semibold); }
  .font-bold { font-weight: var(--font-weight-bold); }

  .text-primary { color: var(--tg-text-primary); }
  .text-secondary { color: var(--tg-text-secondary); }
  .text-tertiary { color: var(--tg-text-tertiary); }
`;
