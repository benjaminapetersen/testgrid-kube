import {
  html,
  fixture,
  defineCE,
  unsafeStatic,
  expect,
} from '@open-wc/testing';

import { TestgridIndex } from './index.js';

describe('Testgrid Index page', () => {
  let element: TestgridIndex;
  beforeEach(async () => {
    const tagName = defineCE(class extends TestgridIndex { });
    const tag = unsafeStatic(tagName);
    element = await fixture(html`<${tag}></${tag}>`);
  });

  it('renders with a two-column layout', async () => {
    await element.updateComplete;

    const layout = element.shadowRoot!.querySelector('.index-layout');
    expect(layout).to.exist;

    const sidebar = element.shadowRoot!.querySelector('.sidebar');
    expect(sidebar).to.exist;

    const mainContent = element.shadowRoot!.querySelector('.main-content');
    expect(mainContent).to.exist;
  });

  it('shows API status card', async () => {
    await element.updateComplete;

    const apiCard = element.shadowRoot!.querySelector('.info-card.api-status');
    expect(apiCard).to.exist;

    const cardHeader = apiCard!.querySelector('.card-header h3');
    expect(cardHeader?.textContent).to.equal('API Connection');
  });

  it('shows statistics card', async () => {
    await element.updateComplete;

    const statsCard = element.shadowRoot!.querySelector('.info-card.stats');
    expect(statsCard).to.exist;

    const statsGrid = statsCard!.querySelector('.stats-grid');
    expect(statsGrid).to.exist;

    const statItems = statsCard!.querySelectorAll('.stat-item');
    expect(statItems).to.have.length(3);
  });

  it('shows getting started card', async () => {
    await element.updateComplete;

    const gettingStartedCard = element.shadowRoot!.querySelector('.info-card.getting-started');
    expect(gettingStartedCard).to.exist;

    const tips = gettingStartedCard!.querySelectorAll('.tips-list li');
    expect(tips.length).to.be.greaterThan(0);
  });

  it('has a search/filter input in sidebar', async () => {
    await element.updateComplete;

    const searchInput = element.shadowRoot!.querySelector('.search-input');
    expect(searchInput).to.exist;
    expect(searchInput!.getAttribute('placeholder')).to.equal('Filter groups...');
  });
});
