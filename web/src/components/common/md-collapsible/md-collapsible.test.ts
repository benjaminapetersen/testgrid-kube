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
        <span slot="header-content">Slotted Header</span>
        <p>Content</p>
      </md-collapsible>
    `);

    const headerSlot = el.shadowRoot!.querySelector('slot[name="header-content"]') as HTMLSlotElement;
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
        <span slot="header-content"><strong>Bold</strong> and <em>italic</em></span>
        <p>Content</p>
      </md-collapsible>
    `);

    const headerSlot = el.shadowRoot!.querySelector('slot[name="header-content"]') as HTMLSlotElement;
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

  it('supports custom header-start slot', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Test">
        <span slot="header-start">+</span>
        <p>Content</p>
      </md-collapsible>
    `);

    const iconSlot = el.shadowRoot!.querySelector('slot[name="header-start"]') as HTMLSlotElement;
    const assignedNodes = iconSlot.assignedNodes();
    expect(assignedNodes.length).to.equal(1);
    expect((assignedNodes[0] as HTMLElement).textContent).to.equal('+');
  });

  it('supports header-end slot', async () => {
    const el = await fixture<MdCollapsible>(html`
      <md-collapsible headerText="Test">
        <span slot="header-end">Badge</span>
        <p>Content</p>
      </md-collapsible>
    `);

    const trailingSlot = el.shadowRoot!.querySelector('slot[name="header-end"]') as HTMLSlotElement;
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

  describe('collapseWithChildren', () => {
    it('collapses parent with collapseWithChildren when child is collapsed', async () => {
      const wrapper = await fixture(html`
        <div>
          <md-collapsible id="parent" headerText="Parent" expanded collapseWithChildren>
            <md-collapsible id="child" headerText="Child" expanded>
              <p>Content</p>
            </md-collapsible>
          </md-collapsible>
        </div>
      `);

      const parent = wrapper.querySelector('#parent') as MdCollapsible;
      const child = wrapper.querySelector('#child') as MdCollapsible;

      expect(parent.expanded).to.be.true;
      expect(child.expanded).to.be.true;

      // Collapse the child
      const childButton = child.shadowRoot!.querySelector('.header') as HTMLButtonElement;
      childButton.click();
      await child.updateComplete;
      await parent.updateComplete;

      // Both should be collapsed
      expect(child.expanded).to.be.false;
      expect(parent.expanded).to.be.false;
    });

    it('does not collapse parent without collapseWithChildren when child is collapsed', async () => {
      const wrapper = await fixture(html`
        <div>
          <md-collapsible id="parent" headerText="Parent" expanded>
            <md-collapsible id="child" headerText="Child" expanded>
              <p>Content</p>
            </md-collapsible>
          </md-collapsible>
        </div>
      `);

      const parent = wrapper.querySelector('#parent') as MdCollapsible;
      const child = wrapper.querySelector('#child') as MdCollapsible;

      // Collapse the child
      const childButton = child.shadowRoot!.querySelector('.header') as HTMLButtonElement;
      childButton.click();
      await child.updateComplete;
      await parent.updateComplete;

      // Only child should be collapsed - parent ignores child collapse by default
      expect(child.expanded).to.be.false;
      expect(parent.expanded).to.be.true;
    });

    it('collapseWithChildren bubbles through multiple opted-in levels', async () => {
      const wrapper = await fixture(html`
        <div>
          <md-collapsible id="grandparent" headerText="Grandparent" expanded collapseWithChildren>
            <md-collapsible id="parent" headerText="Parent" expanded collapseWithChildren>
              <md-collapsible id="child" headerText="Child" expanded>
                <p>Content</p>
              </md-collapsible>
            </md-collapsible>
          </md-collapsible>
        </div>
      `);

      const grandparent = wrapper.querySelector('#grandparent') as MdCollapsible;
      const parent = wrapper.querySelector('#parent') as MdCollapsible;
      const child = wrapper.querySelector('#child') as MdCollapsible;

      // Collapse the child
      const childButton = child.shadowRoot!.querySelector('.header') as HTMLButtonElement;
      childButton.click();
      await child.updateComplete;
      await parent.updateComplete;
      await grandparent.updateComplete;

      // All should be collapsed (all opted in)
      expect(child.expanded).to.be.false;
      expect(parent.expanded).to.be.false;
      expect(grandparent.expanded).to.be.false;
    });

    it('parent without collapseWithChildren does not collapse even if grandparent has it', async () => {
      const wrapper = await fixture(html`
        <div>
          <md-collapsible id="grandparent" headerText="Grandparent" expanded collapseWithChildren>
            <md-collapsible id="parent" headerText="Parent" expanded>
              <md-collapsible id="child" headerText="Child" expanded>
                <p>Content</p>
              </md-collapsible>
            </md-collapsible>
          </md-collapsible>
        </div>
      `);

      const grandparent = wrapper.querySelector('#grandparent') as MdCollapsible;
      const parent = wrapper.querySelector('#parent') as MdCollapsible;
      const child = wrapper.querySelector('#child') as MdCollapsible;

      // Collapse the child
      const childButton = child.shadowRoot!.querySelector('.header') as HTMLButtonElement;
      childButton.click();
      await child.updateComplete;
      await parent.updateComplete;
      await grandparent.updateComplete;

      // Child collapsed, parent doesn't have opt-in so stays expanded
      // Grandparent also receives the event and collapses
      expect(child.expanded).to.be.false;
      expect(parent.expanded).to.be.true;
      expect(grandparent.expanded).to.be.false;
    });

    it('does not trigger when expanding', async () => {
      const wrapper = await fixture(html`
        <div>
          <md-collapsible id="parent" headerText="Parent" expanded collapseWithChildren>
            <md-collapsible id="child" headerText="Child">
              <p>Content</p>
            </md-collapsible>
          </md-collapsible>
        </div>
      `);

      const parent = wrapper.querySelector('#parent') as MdCollapsible;
      const child = wrapper.querySelector('#child') as MdCollapsible;

      expect(child.expanded).to.be.false;
      expect(parent.expanded).to.be.true;

      // Expand the child
      const childButton = child.shadowRoot!.querySelector('.header') as HTMLButtonElement;
      childButton.click();
      await child.updateComplete;
      await parent.updateComplete;

      // Both should be expanded (only triggers on collapse, not expand)
      expect(child.expanded).to.be.true;
      expect(parent.expanded).to.be.true;
    });

    it('only affects opted-in parents, not siblings', async () => {
      const wrapper = await fixture(html`
        <div>
          <md-collapsible id="parent" headerText="Parent" expanded collapseWithChildren>
            <md-collapsible id="sibling1" headerText="Sibling 1" expanded>
              <p>Content</p>
            </md-collapsible>
            <md-collapsible id="sibling2" headerText="Sibling 2" expanded>
              <p>Content</p>
            </md-collapsible>
            <md-collapsible id="sibling3" headerText="Sibling 3" expanded>
              <p>Content</p>
            </md-collapsible>
          </md-collapsible>
        </div>
      `);

      const parent = wrapper.querySelector('#parent') as MdCollapsible;
      const sibling1 = wrapper.querySelector('#sibling1') as MdCollapsible;
      const sibling2 = wrapper.querySelector('#sibling2') as MdCollapsible;
      const sibling3 = wrapper.querySelector('#sibling3') as MdCollapsible;

      // Collapse sibling2
      const sibling2Button = sibling2.shadowRoot!.querySelector('.header') as HTMLButtonElement;
      sibling2Button.click();
      await sibling2.updateComplete;
      await parent.updateComplete;

      // sibling2 and parent collapsed, but siblings 1 and 3 remain expanded
      expect(sibling2.expanded).to.be.false;
      expect(parent.expanded).to.be.false;
      expect(sibling1.expanded).to.be.true;
      expect(sibling3.expanded).to.be.true;
    });
  });
});
