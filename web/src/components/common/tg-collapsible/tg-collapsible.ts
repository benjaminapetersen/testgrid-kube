import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MdCollapsible } from '../md-collapsible/md-collapsible.js';
import { sharedStyles } from '../../../styles/shared-styles.js';
import '@material/web/icon/icon.js';

/**
 * TestGrid-styled collapsible section component.
 * Extends the generic md-collapsible with TestGrid-specific styling.
 *
 * @slot header - Content for the header (label, icons, etc.)
 * @slot - Default slot for the collapsible content
 *
 * @fires toggle - Fired when expanded state changes. Detail: { expanded: boolean }
 *
 * @example
 * ```html
 * <tg-collapsible .badgeCount=${5}>
 *   <span slot="header">Section Title</span>
 *   <div>Content goes here...</div>
 * </tg-collapsible>
 * ```
 */
@customElement('tg-collapsible')
export class TgCollapsible extends MdCollapsible {
  /** Icon to show when collapsed (uses Material Symbols) */
  @property({ type: String })
  collapsedIcon = 'chevron_right';

  /** Icon to show when expanded (uses Material Symbols) */
  @property({ type: String })
  expandedIcon = 'expand_more';

  /** Optional badge count to display */
  @property({ type: Number })
  badgeCount?: number;

  render() {
    return html`
      <div class="collapsible ${this.expanded ? 'expanded' : ''} ${this.disabled ? 'disabled' : ''}">
        <button
          part="header"
          class="header"
          @click=${this.toggle}
          aria-expanded=${this.expanded}
          ?disabled=${this.disabled}
        >
          <md-icon class="chevron">${this.expanded ? this.expandedIcon : this.collapsedIcon}</md-icon>
          <span class="header-content">
            <slot name="header">${this.headerText}</slot>
          </span>
          ${this.badgeCount !== undefined ? html`
            <span class="badge">${this.badgeCount}</span>
          ` : ''}
        </button>
        <div part="content" class="content">
          <div class="content-inner">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [sharedStyles, css`
    :host {
      display: block;
    }

    .collapsible {
      border-bottom: 1px solid var(--tg-border-light, #eee);
    }

    .collapsible:last-child {
      border-bottom: none;
    }

    .header {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 16px;
      background: var(--tg-collapsible-header-bg, transparent);
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--tg-text-primary);
      text-align: left;
      transition: background-color 0.15s ease;
      gap: 8px;
    }

    .header:hover:not(:disabled) {
      background: var(--tg-collapsible-header-hover-bg, var(--tg-surface-variant, #f5f5f5));
    }

    .header:focus-visible {
      outline: 2px solid var(--tg-primary);
      outline-offset: -2px;
    }

    .header:disabled {
      cursor: default;
      opacity: 0.6;
    }

    .chevron {
      font-size: 20px;
      color: var(--tg-text-secondary);
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .header-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      overflow: hidden;
    }

    .badge {
      background: var(--tg-primary);
      color: var(--tg-text-inverse, white);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      padding: 2px 8px;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .content {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.2s ease-out;
      overflow: hidden;
    }

    .expanded .content {
      grid-template-rows: 1fr;
    }

    .content-inner {
      min-height: 0;
      overflow: hidden;
    }

    ::slotted(*) {
      display: block;
    }
  `];
}

declare global {
  interface HTMLElementTagNameMap {
    'tg-collapsible': TgCollapsible;
  }
}
