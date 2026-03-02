import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import {
  ListDashboardsResponse,
  ListDashboardGroupsResponse,
} from '../../gen/pb/api/v1/data.js';
import { apiClient } from '../../APIClient.js';
import { navigateWithContext } from '../../utils/navigation.js';
import { APIController } from '../../controllers/api-controller.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import '../common/tg-collapsible/tg-collapsible.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/divider/divider.js';

interface DashboardGroup {
  name: string;
  dashboards: string[];
  expanded: boolean;
}

interface GroupCategory {
  id: string;
  label: string;
  icon: string;
  groups: DashboardGroup[];
  expanded: boolean;
}

interface CacheInfo {
  endpoint: string;
  lastFetched: Date | null;
  loading: boolean;
  error: string | null;
}

@customElement('testgrid-index')
export class TestgridIndex extends LitElement {
  private dashboardGroupsController = new APIController<ListDashboardGroupsResponse>(this);
  private dashboardsController = new APIController<ListDashboardsResponse>(this);

  @state()
  private groups: DashboardGroup[] = [];

  @state()
  private categories: GroupCategory[] = [];

  @state()
  private ungroupedDashboards: string[] = [];

  @state()
  private cacheInfo: CacheInfo = {
    endpoint: '',
    lastFetched: null,
    loading: true,
    error: null,
  };

  @state()
  private totalDashboards = 0;

  @state()
  private searchFilter = '';

  @state()
  private groupsSectionExpanded = false;

  @state()
  private standaloneSectionExpanded = false;

  /**
   * Category definitions for organizing dashboard groups.
   * Groups are matched in order - first match wins.
   */
  private readonly categoryDefinitions: Array<{
    id: string;
    label: string;
    icon: string;
    patterns: RegExp[];
  }> = [
    {
      id: 'sigs',
      label: 'SIGs (Special Interest Groups)',
      icon: 'groups',
      patterns: [/^sig-/i],
    },
    {
      id: 'wgs',
      label: 'Working Groups',
      icon: 'work',
      patterns: [/^wg-/i],
    },
    {
      id: 'clouds',
      label: 'Cloud Providers',
      icon: 'cloud',
      patterns: [
        /^google/i, /^gce/i, /^gke/i,
        /^aws/i, /^amazon/i, /^eks/i,
        /^azure/i, /^aks/i,
        /^ibm/i,
        /^vmware/i, /^vsphere/i,
        /^openstack/i,
        /^digitalocean/i,
        /^alibaba/i, /^aliyun/i,
        /^oracle/i, /^oci/i,
        /^equinix/i,
        /^linode/i,
        /^packet/i,
      ],
    },
    {
      id: 'redhat',
      label: 'Red Hat / OpenShift',
      icon: 'business',
      patterns: [/^redhat/i, /^openshift/i, /^ocp/i, /^okd/i],
    },
    {
      id: 'conformance',
      label: 'Conformance',
      icon: 'verified',
      patterns: [/conformance/i, /^cncf/i],
    },
    {
      id: 'presubmits',
      label: 'Presubmits',
      icon: 'pending_actions',
      patterns: [/presubmit/i, /^pr-/i, /pull-/i],
    },
    {
      id: 'ci',
      label: 'CI / Release',
      icon: 'rocket_launch',
      patterns: [/^ci-/i, /^release/i, /periodic/i, /postsubmit/i],
    },
  ];

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  render() {
    return html`
      <div class="index-layout">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h2>Navigation</h2>
            <input
              type="search"
              class="search-input"
              placeholder="Filter groups..."
              .value=${this.searchFilter}
              @input=${this.handleSearchInput}
            />
          </div>
          <md-divider></md-divider>
          <div class="sidebar-content">
            ${this.cacheInfo.loading ? this.renderLoading() : this.renderNavigation()}
          </div>
        </aside>

        <main class="main-content">
          ${this.renderMainContent()}
        </main>
      </div>
    `;
  }

  private renderLoading() {
    return html`
      <div class="loading-container">
        <md-circular-progress indeterminate></md-circular-progress>
        <p>Loading dashboard data...</p>
      </div>
    `;
  }

  private renderNavigation() {
    const searchLower = this.searchFilter.toLowerCase();

    // Filter categories based on search - include category if any group matches
    const filteredCategories = this.categories
      .map(category => ({
        ...category,
        groups: category.groups.filter(g =>
          g.name.toLowerCase().includes(searchLower) ||
          g.dashboards.some(d => d.toLowerCase().includes(searchLower))
        )
      }))
      .filter(category => category.groups.length > 0);

    const filteredUngrouped = this.ungroupedDashboards.filter(d =>
      d.toLowerCase().includes(searchLower)
    );

    const totalGroups = filteredCategories.reduce((sum, cat) => sum + cat.groups.length, 0);

    return html`
      <tg-collapsible
        class="top-level-section"
        ?expanded=${this.groupsSectionExpanded}
        .badgeCount=${totalGroups}
        @toggle=${(e: CustomEvent) => this.groupsSectionExpanded = e.detail.expanded}
      >
        <span slot="header-content" class="section-header">
          <md-icon>folder</md-icon>
          Dashboard Groups
        </span>
        <div class="categories-list">
          ${map(filteredCategories, category => this.renderCategory(category))}
        </div>
      </tg-collapsible>

      ${filteredUngrouped.length > 0 ? html`
        <tg-collapsible
          class="top-level-section"
          ?expanded=${this.standaloneSectionExpanded}
          .badgeCount=${filteredUngrouped.length}
          @toggle=${(e: CustomEvent) => this.standaloneSectionExpanded = e.detail.expanded}
        >
          <span slot="header-content" class="section-header">
            <md-icon>dashboard</md-icon>
            Standalone Dashboards
          </span>
          <md-list class="standalone-list">
            ${map(filteredUngrouped, name => html`
              <md-list-item
                type="button"
                @click=${() => navigateWithContext(name, 'dashboard')}
              >
                <md-icon slot="start">assessment</md-icon>
                ${name}
              </md-list-item>
            `)}
          </md-list>
        </tg-collapsible>
      ` : nothing}
    `;
  }

  private renderCategory(category: GroupCategory) {
    return html`
      <tg-collapsible
        class="category-section"
        ?expanded=${category.expanded}
        .badgeCount=${category.groups.length}
        @toggle=${(e: CustomEvent) => this.toggleCategory(category.id, e.detail.expanded)}
      >
        <span slot="header-content" class="category-header">
          <md-icon>${category.icon}</md-icon>
          <span class="category-name">${category.label}</span>
        </span>
        <div class="groups-list">
          ${map(category.groups, group => this.renderGroupItem(group))}
        </div>
      </tg-collapsible>
    `;
  }

  private toggleCategory(categoryId: string, expanded: boolean) {
    this.categories = this.categories.map(c =>
      c.id === categoryId ? { ...c, expanded } : c
    );
  }

  private renderGroupItem(group: DashboardGroup) {
    return html`
      <tg-collapsible
        ?expanded=${group.expanded}
        .badgeCount=${group.dashboards.length}
        @toggle=${(e: CustomEvent) => this.toggleGroup(group.name, e.detail.expanded)}
      >
        <span slot="header-content" class="group-header">
          <md-icon>folder</md-icon>
          <span class="group-name">${group.name}</span>
        </span>
        <div class="group-dashboards">
          <button
            class="view-group-btn"
            @click=${() => navigateWithContext(group.name, 'dashboard-group')}
          >
            <md-icon>open_in_new</md-icon>
            View Group Page
          </button>
          <md-list class="dashboard-list">
            ${map(group.dashboards, dashboard => html`
              <md-list-item
                type="button"
                @click=${() => navigateWithContext(dashboard, 'dashboard')}
              >
                <md-icon slot="start">assessment</md-icon>
                ${dashboard}
              </md-list-item>
            `)}
          </md-list>
        </div>
      </tg-collapsible>
    `;
  }

  private toggleGroup(groupName: string, expanded: boolean) {
    this.groups = this.groups.map(g =>
      g.name === groupName ? { ...g, expanded } : g
    );
  }

  private renderMainContent() {
    return html`
      <div class="cards-grid">
        <!-- API Status Card -->
        <div class="info-card api-status">
          <div class="card-header">
            <md-icon>cloud</md-icon>
            <h3>API Connection</h3>
          </div>
          <div class="card-body">
            <div class="status-row">
              <span class="label">Endpoint:</span>
              <code class="endpoint">${this.cacheInfo.endpoint || 'Detecting...'}</code>
            </div>
            <div class="status-row">
              <span class="label">Status:</span>
              ${this.cacheInfo.error
                ? html`<span class="status error"><md-icon>error</md-icon> Error</span>`
                : this.cacheInfo.loading
                  ? html`<span class="status loading"><md-icon>sync</md-icon> Loading</span>`
                  : html`<span class="status success"><md-icon>check_circle</md-icon> Connected</span>`
              }
            </div>
            <div class="status-row">
              <span class="label">Last Refreshed:</span>
              <span class="value">${this.formatLastFetched()}</span>
            </div>
            <div class="status-row">
              <span class="label">Cache TTL:</span>
              <span class="value">5 minutes</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="refresh-btn" @click=${this.handleRefresh} ?disabled=${this.cacheInfo.loading}>
              <md-icon>refresh</md-icon>
              Refresh Data
            </button>
          </div>
        </div>

        <!-- Statistics Card -->
        <div class="info-card stats">
          <div class="card-header">
            <md-icon>analytics</md-icon>
            <h3>Data Summary</h3>
          </div>
          <div class="card-body stats-grid">
            <div class="stat-item">
              <span class="stat-value">${this.groups.length}</span>
              <span class="stat-label">Dashboard Groups</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.totalDashboards}</span>
              <span class="stat-label">Total Dashboards</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.ungroupedDashboards.length}</span>
              <span class="stat-label">Standalone</span>
            </div>
          </div>
        </div>

        <!-- Getting Started Card -->
        <div class="info-card getting-started">
          <div class="card-header">
            <md-icon>help</md-icon>
            <h3>Getting Started</h3>
          </div>
          <div class="card-body">
            <p>Welcome to TestGrid! This dashboard displays test results from Prow CI jobs.</p>
            <ul class="tips-list">
              <li><md-icon>arrow_right</md-icon> Use the sidebar to browse dashboard groups</li>
              <li><md-icon>arrow_right</md-icon> Click on a group to see its dashboards and test status</li>
              <li><md-icon>arrow_right</md-icon> Use the search bar in the header to find specific dashboards</li>
              <li><md-icon>arrow_right</md-icon> Data is cached locally and refreshes every 5 minutes</li>
            </ul>
          </div>
        </div>

        ${this.cacheInfo.error ? html`
          <div class="info-card error-card">
            <div class="card-header">
              <md-icon>warning</md-icon>
              <h3>Connection Error</h3>
            </div>
            <div class="card-body">
              <p class="error-message">${this.cacheInfo.error}</p>
              <p>Please check that the API server is running and accessible.</p>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private formatLastFetched(): string {
    if (!this.cacheInfo.lastFetched) return 'Never';
    const now = Date.now();
    const diff = now - this.cacheInfo.lastFetched.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    return this.cacheInfo.lastFetched.toLocaleTimeString();
  }

  private handleSearchInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchFilter = input.value;
  }

  private async handleRefresh() {
    this.dashboardGroupsController.clear();
    this.dashboardsController.clear();
    await this.loadData();
  }

  static styles = [sharedStyles, css`
    :host {
      display: block;
      height: 100%;
    }

    .index-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      height: calc(100vh - var(--tg-header-height));
      overflow: hidden;
    }

    /* Sidebar styles */
    .sidebar {
      background: var(--tg-surface);
      border-right: 1px solid var(--tg-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 20px 16px;
      background: linear-gradient(135deg, var(--tg-header-bg) 0%, #2d2d4a 100%);
      color: var(--tg-text-inverse);
    }

    .sidebar-header h2 {
      margin: 0 0 16px 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sidebar-header h2::before {
      content: 'menu';
      font-family: 'Material Symbols Outlined';
      font-size: 20px;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px;
      border: none;
      border-radius: 6px;
      font-size: var(--font-size-sm);
      font-family: var(--font-family);
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.95);
      color: var(--tg-text-primary);
    }

    .search-input::placeholder {
      color: var(--tg-text-tertiary);
      font-family: var(--font-family);
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    /* Top-level collapsible sections */
    .top-level-section {
      --tg-collapsible-header-bg: linear-gradient(135deg, #f0f4f8 0%, #e8ecf0 100%);
      --tg-collapsible-header-hover-bg: linear-gradient(135deg, #e8ecf0 0%, #dce0e4 100%);
      border-bottom: 1px solid var(--tg-border);
    }

    .top-level-section:last-child {
      border-bottom: none;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-header md-icon {
      font-size: 18px;
      color: var(--tg-primary);
    }

    /* Categories list (tier 2) */
    .categories-list {
      padding-left: 8px;
      background: var(--tg-surface);
    }

    .category-section {
      --tg-collapsible-header-bg: transparent;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .category-header md-icon {
      font-size: 18px;
      color: var(--tg-secondary);
    }

    .category-name {
      font-size: var(--font-size-sm);
    }

    /* Inner content for both top-level sections */
    .groups-list,
    .standalone-list {
      padding-left: 16px;
      margin-left: 4px;
      background: var(--tg-surface);
    }

    .groups-list tg-collapsible {
      --tg-collapsible-header-bg: transparent;
    }

    .standalone-list {
      padding-top: 8px;
      padding-bottom: 8px;
    }

    .nav-section {
      padding: 8px 0;
    }

    .nav-section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin: 0;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--tg-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .nav-section-title md-icon {
      font-size: 18px;
      color: var(--tg-primary);
    }

    md-list {
      --md-list-item-leading-icon-color: var(--tg-primary);
      --md-list-item-label-text-size: var(--font-size-sm);
      --md-list-item-label-text-font: var(--font-family);
      --md-list-item-supporting-text-font: var(--font-family);
    }

    .dashboard-count {
      font-size: var(--font-size-xs);
      color: var(--tg-text-tertiary);
    }

    /* Main content styles */
    .main-content {
      padding: 24px;
      overflow-y: auto;
      background: var(--tg-surface-variant);
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      max-width: 1200px;
    }

    .info-card {
      background: var(--tg-surface);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: linear-gradient(135deg, var(--tg-primary), var(--tg-secondary));
      color: var(--tg-text-inverse);
    }

    .card-header md-icon {
      font-size: 24px;
    }

    .card-header h3 {
      margin: 0;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
    }

    .card-body {
      padding: 20px;
    }

    .card-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--tg-border);
      background: #fafafa;
    }

    /* API Status Card */
    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--tg-border-light);
      font-size: var(--font-size-sm);
    }

    .status-row:last-child {
      border-bottom: none;
    }

    .status-row .label {
      font-weight: var(--font-weight-medium);
      color: var(--tg-text-secondary);
    }

    .status-row .value {
      color: var(--tg-text-primary);
    }

    .status-row .endpoint {
      background: var(--tg-surface-variant);
      padding: 4px 8px;
      border-radius: 4px;
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--tg-text-primary);
    }

    .status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-sm);
    }

    .status md-icon {
      font-size: 16px;
    }

    .status.success {
      color: var(--tg-status-pass);
    }

    .status.loading {
      color: var(--tg-status-pending);
    }

    .status.error {
      color: var(--tg-status-fail);
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--tg-primary);
      color: var(--tg-text-inverse);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      font-family: var(--font-family);
      transition: background 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: var(--tg-link-hover-color);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .refresh-btn md-icon {
      font-size: 18px;
    }

    /* Stats Card */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      text-align: center;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--tg-primary);
    }

    .stat-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--tg-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Getting Started Card */
    .getting-started p {
      margin: 0 0 16px 0;
      color: var(--tg-text-secondary);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
    }

    .tips-list {
      margin: 0;
      padding: 0;
    }

    .tips-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      color: var(--tg-text-secondary);
      font-size: var(--font-size-sm);
    }

    .tips-list md-icon {
      font-size: 16px;
      color: var(--tg-primary);
    }

    /* Error Card */
    .error-card .card-header {
      background: linear-gradient(135deg, var(--tg-status-fail), #c62828);
    }

    .error-message {
      color: var(--tg-status-fail);
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-sm);
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      gap: 16px;
      color: var(--tg-text-tertiary);
      font-size: var(--font-size-sm);
    }

    /* Collapsible Groups */
    tg-collapsible {
      --md-list-item-label-text-size: var(--font-size-xs);
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .group-header md-icon {
      font-size: 18px;
      color: var(--tg-primary);
    }

    .group-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .group-dashboards {
      padding: 0 8px 8px 28px;
    }

    .view-group-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 4px;
      background: var(--tg-surface-variant);
      border: 1px solid var(--tg-border);
      border-radius: 6px;
      cursor: pointer;
      font-family: var(--font-family);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--tg-primary);
      transition: all 0.15s ease;
    }

    .view-group-btn:hover {
      background: var(--tg-primary);
      color: var(--tg-text-inverse);
      border-color: var(--tg-primary);
    }

    .view-group-btn md-icon {
      font-size: 16px;
    }

    .dashboard-list {
      --md-list-item-one-line-container-height: 40px;
      --md-list-item-leading-icon-size: 18px;
    }

    .dashboard-list md-list-item {
      border-radius: 4px;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .index-layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        max-height: 300px;
        border-right: none;
        border-bottom: 1px solid var(--tg-border);
      }

      .main-content {
        height: auto;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `];

  /**
   * Categorize dashboard groups based on name patterns.
   */
  private categorizeGroups(groups: DashboardGroup[]): GroupCategory[] {
    const categorized: Map<string, DashboardGroup[]> = new Map();
    const uncategorized: DashboardGroup[] = [];

    // Initialize category buckets
    for (const def of this.categoryDefinitions) {
      categorized.set(def.id, []);
    }

    // Categorize each group
    for (const group of groups) {
      let matched = false;
      for (const def of this.categoryDefinitions) {
        if (def.patterns.some(pattern => pattern.test(group.name))) {
          categorized.get(def.id)!.push(group);
          matched = true;
          break;
        }
      }
      if (!matched) {
        uncategorized.push(group);
      }
    }

    // Build category objects (only include non-empty categories)
    const result: GroupCategory[] = [];
    for (const def of this.categoryDefinitions) {
      const categoryGroups = categorized.get(def.id)!;
      if (categoryGroups.length > 0) {
        result.push({
          id: def.id,
          label: def.label,
          icon: def.icon,
          groups: categoryGroups,
          expanded: false,
        });
      }
    }

    // Add "Other" category for uncategorized groups
    if (uncategorized.length > 0) {
      result.push({
        id: 'other',
        label: 'Other',
        icon: 'more_horiz',
        groups: uncategorized,
        expanded: false,
      });
    }

    return result;
  }

  private async loadData() {
    this.cacheInfo = {
      ...this.cacheInfo,
      endpoint: typeof process !== 'undefined' && process.env?.API_URL
        ? process.env.API_URL
        : window.location.origin,
      loading: true,
      error: null,
    };

    try {
      const [groupsResponse, dashboardsResponse] = await Promise.all([
        this.dashboardGroupsController.fetch('dashboard-groups', () => apiClient.getDashboardGroups()),
        this.dashboardsController.fetch('dashboards', () => apiClient.getDashboards())
      ]);

      const groupsMap: Record<string, string[]> = {};
      const ungrouped: string[] = [];

      groupsResponse.dashboardGroups.forEach(group => {
        groupsMap[group.name] = [];
      });

      dashboardsResponse.dashboards.forEach(dashboard => {
        const groupName = dashboard.dashboardGroupName;
        if (groupName && groupsMap[groupName]) {
          groupsMap[groupName].push(dashboard.name);
        } else {
          ungrouped.push(dashboard.name);
        }
      });

      // Convert to array and sort
      this.groups = Object.entries(groupsMap)
        .map(([name, dashboards]) => ({
          name,
          dashboards: dashboards.sort(),
          expanded: false,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Categorize groups
      this.categories = this.categorizeGroups(this.groups);

      this.ungroupedDashboards = ungrouped.sort();
      this.totalDashboards = dashboardsResponse.dashboards.length;

      this.cacheInfo = {
        ...this.cacheInfo,
        lastFetched: new Date(),
        loading: false,
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.cacheInfo = {
        ...this.cacheInfo,
        loading: false,
        error: errorMessage,
      };
      // eslint-disable-next-line no-console
      console.error('Failed to load data:', error);
    }
  }
}
