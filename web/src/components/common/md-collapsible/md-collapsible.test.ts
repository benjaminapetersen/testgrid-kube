import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { MdCollapsible } from './md-collapsible.js';
import './md-collapsible.js';

describe('md-collapsible', () => {
  it('renders with default collapsed state', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Test Header">
        <p>Content</p>
      </md-collapsible>
    `);

    expect(el.expanded).to.be.false;
    const button = el.shadowRoot!.querySelector('.header');
    expect(button?.getAttribute('aria-expanded')).to.equal('false');
  });

  it('renders with expanded state when property is set', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Test Header" expanded>
        <p>Content</p>
      </md-collapsible>
    `);

    expect(el.expanded).to.be.true;
    const button = el.shadowRoot!.querySelector('.header');
    expect(button?.getAttribute('aria-expanded')).to.equal('true');
  });

  it('toggles expanded state on header click', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Test Header">
        <p>Content</p>
      </md-collapsible>
    `);

    const button = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    expect(el.expanded).to.be.false;

    button.click();
    expect(el.expanded).to.be.true;

    button.click();
    expect(el.expanded).to.be.false;
  });

  it('dispatches toggle event with expanded state', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Test Header">
        <p>Content</p>
      </md-collapsible>
    `);

    const button = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;

    setTimeout(() => button.click());
    const event = await oneEvent(el, 'toggle');
    expect(event.detail.expanded).to.be.true;
  });

  it('renders slotted header content', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible>
        <span slot="header">Slotted Header</span>
        <p>Content</p>
      </md-collapsible>
    `);

    const headerSlot = el.shadowRoot!.querySelector('slot[name="header"]') as HTMLSlotElement;
    const assignedNodes = headerSlot.assignedNodes();
    expect(assignedNodes.length).to.equal(1);
    expect((assignedNodes[0] as HTMLElement).textContent).to.equal('Slotted Header');
  });

  it('renders headerText as fallback when no slot is provided', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Fallback Header">
        <p>Content</p>
      </md-collapsible>
    `);

    const headerContent = el.shadowRoot!.querySelector('.header-content');
    expect(headerContent?.textContent?.trim()).to.equal('Fallback Header');
  });

  it('renders slotted header with HTML styling', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible>
        <span slot="header"><strong>Bold</strong> and <em>italic</em></span>
        <p>Content</p>
      </md-collapsible>
    `);

    const headerSlot = el.shadowRoot!.querySelector('slot[name="header"]') as HTMLSlotElement;
    const assignedNodes = headerSlot.assignedNodes();
    expect(assignedNodes.length).to.equal(1);

    const slottedElement = assignedNodes[0] as HTMLElement;
    expect(slottedElement.querySelector('strong')?.textContent).to.equal('Bold');
    expect(slottedElement.querySelector('em')?.textContent).to.equal('italic');
  });

  it('does not toggle when disabled', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Test Header" disabled>
        <p>Content</p>
      </md-collapsible>
    `);

    const button = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    expect(el.expanded).to.be.false;

    button.click();
    expect(el.expanded).to.be.false;
  });

  it('renders default expand/collapse icons', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Test">
        <p>Content</p>
      </md-collapsible>
    `);

    const icon = el.shadowRoot!.querySelector('.default-icon');
    expect(icon?.textContent?.trim()).to.equal('▶');

    const button = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    expect(icon?.textContent?.trim()).to.equal('▼');
  });

  it('supports custom icon slot', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Test">
        <span slot="icon">+</span>
        <p>Content</p>
      </md-collapsible>
    `);

    const iconSlot = el.shadowRoot!.querySelector('slot[name="icon"]') as HTMLSlotElement;
    const assignedNodes = iconSlot.assignedNodes();
    expect(assignedNodes.length).to.equal(1);
    expect((assignedNodes[0] as HTMLElement).textContent).to.equal('+');
  });

  it('supports trailing slot', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Test">
        <span slot="trailing">Badge</span>
        <p>Content</p>
      </md-collapsible>
    `);

    const trailingSlot = el.shadowRoot!.querySelector('slot[name="trailing"]') as HTMLSlotElement;
    const assignedNodes = trailingSlot.assignedNodes();
    expect(assignedNodes.length).to.equal(1);
    expect((assignedNodes[0] as HTMLElement).textContent).to.equal('Badge');
  });

  it('does not close outer collapsible when inner collapsible is toggled', async () => {
    // Create nested collapsibles
    const wrapper = await fixture(html`
      <div>
        <md-collapsible id="outer" headerText="Outer" expanded>
          <md-collapsible id="inner" headerText="Inner" expanded>
            <p>Inner content</p>
          </md-collapsible>
        </md-collapsible>
      </div>
    `);

    const outer = wrapper.querySelector('#outer') as MdCollapsible;
    const inner = wrapper.querySelector('#inner') as MdCollapsible;

    // Both should start expanded
    expect(outer.expanded).to.be.true;
    expect(inner.expanded).to.be.true;

    // Click on inner to collapse it
    const innerButton = inner.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    innerButton.click();
    await inner.updateComplete;
    await outer.updateComplete;

    // Inner should be collapsed, outer should still be expanded
    expect(inner.expanded).to.be.false;
    expect(outer.expanded).to.be.true;
  });

  it('toggle event does not bubble to parent elements', async () => {
    let parentHandlerCalled = false;

    const wrapper = await fixture(html`
      <div @toggle=${() => { parentHandlerCalled = true; }}>
        <md-collapsible headerText="Test">
          <p>Content</p>
        </md-collapsible>
      </div>
    `);

    const el = wrapper.querySelector('md-collapsible') as MdCollapsible;
    const button = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    button.click();

    // The parent's toggle handler should NOT have been called
    expect(parentHandlerCalled).to.be.false;
  });
});
