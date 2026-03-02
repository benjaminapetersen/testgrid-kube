import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { TgCollapsible } from './tg-collapsible.js';
import './tg-collapsible.js';

describe('tg-collapsible', () => {
  it('renders with default collapsed state', async () => {
    const el = await fixture<TgCollapsible>(html`
      <tg-collapsible headerText="Test Header">
        <p>Content</p>
      </tg-collapsible>
    `);

    expect(el.expanded).to.be.false;
    const button = el.shadowRoot!.querySelector('.header');
    expect(button?.getAttribute('aria-expanded')).to.equal('false');
  });

  it('renders with expanded state when property is set', async () => {
    const el = await fixture<TgCollapsible>(html`
      <tg-collapsible headerText="Test Header" expanded>
        <p>Content</p>
      </tg-collapsible>
    `);

    expect(el.expanded).to.be.true;
    const button = el.shadowRoot!.querySelector('.header');
    expect(button?.getAttribute('aria-expanded')).to.equal('true');
  });

  it('toggles expanded state on header click', async () => {
    const el = await fixture<TgCollapsible>(html`
      <tg-collapsible headerText="Test Header">
        <p>Content</p>
      </tg-collapsible>
    `);

    const button = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    expect(el.expanded).to.be.false;

    button.click();
    expect(el.expanded).to.be.true;

    button.click();
    expect(el.expanded).to.be.false;
  });

  it('dispatches toggle event with expanded state', async () => {
    const el = await fixture<TgCollapsible>(html`
      <tg-collapsible headerText="Test Header">
        <p>Content</p>
      </tg-collapsible>
    `);

    const button = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;

    setTimeout(() => button.click());
    const event = await oneEvent(el, 'toggle');
    expect(event.detail.expanded).to.be.true;
  });

  it('renders badge count when provided', async () => {
    const el = await fixture<TgCollapsible>(html`
      <tg-collapsible headerText="Test Header" .badgeCount=${5}>
        <p>Content</p>
      </tg-collapsible>
    `);

    const badge = el.shadowRoot!.querySelector('.badge');
    expect(badge).to.exist;
    expect(badge?.textContent).to.equal('5');
  });

  it('does not render badge when badgeCount is undefined', async () => {
    const el = await fixture<TgCollapsible>(html`
      <tg-collapsible headerText="Test Header">
        <p>Content</p>
      </tg-collapsible>
    `);

    const badge = el.shadowRoot!.querySelector('.badge');
    expect(badge).to.be.null;
  });

  it('renders slotted header content', async () => {
    const el = await fixture<TgCollapsible>(html`
      <tg-collapsible>
        <span slot="header-content">Slotted Header</span>
        <p>Content</p>
      </tg-collapsible>
    `);

    const headerSlot = el.shadowRoot!.querySelector('slot[name="header-content"]') as HTMLSlotElement;
    const assignedNodes = headerSlot.assignedNodes();
    expect(assignedNodes.length).to.equal(1);
    expect((assignedNodes[0] as HTMLElement).textContent).to.equal('Slotted Header');
  });

  it('does not toggle when disabled', async () => {
    const el = await fixture<TgCollapsible>(html`
      <tg-collapsible headerText="Test Header" disabled>
        <p>Content</p>
      </tg-collapsible>
    `);

    const button = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    expect(el.expanded).to.be.false;

    button.click();
    expect(el.expanded).to.be.false;
  });

  it('uses Material icons for expand/collapse', async () => {
    const el = await fixture<TgCollapsible>(html`
      <tg-collapsible headerText="Test">
        <p>Content</p>
      </tg-collapsible>
    `);

    const chevron = el.shadowRoot!.querySelector('md-icon.chevron');
    expect(chevron?.textContent?.trim()).to.equal('chevron_right');

    const button = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    expect(chevron?.textContent?.trim()).to.equal('expand_more');
  });

  it('allows custom Material icons', async () => {
    const el = await fixture<TgCollapsible>(html`
      <tg-collapsible
        headerText="Test"
        collapsedIcon="add"
        expandedIcon="remove">
        <p>Content</p>
      </tg-collapsible>
    `);

    const chevron = el.shadowRoot!.querySelector('md-icon.chevron');
    expect(chevron?.textContent?.trim()).to.equal('add');

    const button = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    expect(chevron?.textContent?.trim()).to.equal('remove');
  });
});
