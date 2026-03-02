import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Note: perhaps contribute this minimal version up to material/web?
 * material/web is in need of several of the typical widgets you find in a lib.
 *
 * A Material Design 3 styled collapsible section component with header and expandable content.
 * This component provides core expand/collapse functionality with accessibility support.
 * Extend or wrap this component to add application-specific styling.
 *
 * CSS Custom Properties:
 * - `--collapsible-transition-duration`: Animation duration (default: 0.2s)
 * - `--md-sys-color-on-surface`: Text color
 * - `--md-sys-color-primary`: Focus ring color
 * - `--md-sys-state-hover-opacity`: Hover state layer opacity
 * - `--md-sys-state-focus-opacity`: Focus state layer opacity
 * - `--md-sys-state-pressed-opacity`: Pressed state layer opacity
 *
 * Nested Collapsible Behavior:
 * - By default, nested collapsibles operate independently
 * - Set `collapseWithChildren` on a parent to collapse when any descendant collapses
 *
 * @slot header-start - Leading content in header (custom expand/collapse icon)
 * @slot header-content - Main header content (label, title, etc.)
 * @slot header-end - Trailing content in header (badges, counts, actions)
 * @slot - Default slot for the collapsible content
 *
 * @fires toggle - Fired when expanded state changes. Detail: { expanded: boolean }
 * @fires md-collapsible-collapsed - Fired when collapsed (bubbles). Used internally for nested collapse.
 *
 * @example
 * ```html
 * <md-collapsible>
 *   <span slot="header-content">Section Title</span>
 *   <div>Content goes here...</div>
 * </md-collapsible>
 * ```
 *
 * @example With all header slots
 * ```html
 * <md-collapsible>
 *   <md-icon slot="header-start">folder</md-icon>
 *   <span slot="header-content">Section Title</span>
 *   <span slot="header-end">5 items</span>
 *   <div>Content goes here...</div>
 * </md-collapsible>
 * ```
 *
 * @example Nested with parent collapse
 * ```html
 * <md-collapsible collapseWithChildren>
 *   <span slot="header-content">Parent (collapses with children)</span>
 *   <md-collapsible>
 *     <span slot="header-content">Child</span>
 *     <p>Child content...</p>
 *   </md-collapsible>
 * </md-collapsible>
 * ```
 */
@customElement('md-collapsible')
export class MdCollapsible extends LitElement {
  /** Whether the section is currently expanded */
  @property({ type: Boolean, reflect: true })
  expanded = false;

  /** Header text (alternative to using header slot) */
  @property({ type: String })
  headerText = '';

  /** Disable the collapsible behavior */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * When true, this collapsible will collapse when any of its descendant
   * collapsibles collapse. By default, nested collapsibles operate independently.
   */
  @property({ type: Boolean, reflect: true })
  collapseWithChildren = false;

  @state()
  private animating = false;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('md-collapsible-collapsed', this.didChildCollapse as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('md-collapsible-collapsed', this.didChildCollapse as EventListener);
  }

  private didChildCollapse = (event: CustomEvent) => {
    // Don't handle our own event
    if (event.target === this) return;

    // Only collapse if we've opted in
    if (!this.collapseWithChildren) return;

    // Collapse this parent
    if (this.expanded) {
      this.expanded = false;
      this.animating = true;
      this.dispatchEvent(new CustomEvent('toggle', {
        detail: { expanded: false },
        bubbles: false,
        composed: true
      }));
    }
  };

  protected toggle() {
    if (this.disabled) return;

    const wasExpanded = this.expanded;
    this.expanded = !this.expanded;
    this.animating = true;

    this.dispatchEvent(new CustomEvent('toggle', {
      detail: { expanded: this.expanded },
      bubbles: false,  // Don't bubble to prevent nested collapsibles from triggering parent handlers
      composed: true
    }));

    // If collapsing, dispatch bubbling event for parent collapsibles to optionally handle
    if (wasExpanded && !this.expanded) {
      this.dispatchEvent(new CustomEvent('md-collapsible-collapsed', {
        bubbles: true,
        composed: true
      }));
    }
  }

  private handleAnimationEnd() {
    this.animating = false;
  }

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
          <slot name="header-start">
            <span class="default-icon" aria-hidden="true">${this.expanded ? '▼' : '▶'}</span>
          </slot>
          <span class="header-content">
            <slot name="header-content">${this.headerText}</slot>
          </span>
          <slot name="header-end"></slot>
        </button>
        <div
          part="content"
          class="content ${this.animating ? 'animating' : ''}"
          @transitionend=${this.handleAnimationEnd}
        >
          <div class="content-inner">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  static styles = [css`
    :host {
      display: block;
      /* Material Design 3 tokens - can be overridden by app theme */
      --md-sys-color-on-surface: inherit;
      --md-sys-color-primary: #6750a4;
      --md-sys-state-hover-opacity: 0.08;
      --md-sys-state-focus-opacity: 0.12;
      --md-sys-state-pressed-opacity: 0.12;
    }

    :host([disabled]) {
      pointer-events: none;
      opacity: 0.38; /* M3 disabled opacity */
    }

    .collapsible {
      border-radius: 8px;
    }

    .header {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font: inherit;
      text-align: left;
      gap: 12px;
      position: relative;
      color: var(--md-sys-color-on-surface, inherit);
      -webkit-tap-highlight-color: transparent;
    }

    /* State layer for hover/focus/pressed feedback */
    .header::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: currentColor;
      opacity: 0;
      transition: opacity 0.15s ease;
      pointer-events: none;
    }

    .header:hover::before {
      opacity: var(--md-sys-state-hover-opacity, 0.08);
    }

    .header:focus-visible::before {
      opacity: var(--md-sys-state-focus-opacity, 0.12);
    }

    .header:active::before {
      opacity: var(--md-sys-state-pressed-opacity, 0.12);
    }

    .header:focus-visible {
      outline: 2px solid var(--md-sys-color-primary, #6750a4);
      outline-offset: 2px;
    }

    .header:disabled {
      cursor: default;
    }

    .header:disabled::before {
      display: none;
    }

    .default-icon {
      font-size: 0.75em;
      transition: transform var(--collapsible-transition-duration, 0.2s) ease;
    }

    .header-content {
      flex: 1;
      min-width: 0;
    }

    .content {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--collapsible-transition-duration, 0.2s) ease-out;
      overflow: hidden;
    }

    .expanded .content {
      grid-template-rows: 1fr;
    }

    .content-inner {
      min-height: 0;
      overflow: hidden;
    }
  `];
}

declare global {
  interface HTMLElementTagNameMap {
    'md-collapsible': MdCollapsible;
  }
}
