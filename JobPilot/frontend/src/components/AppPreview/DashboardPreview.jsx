import Header from "../Header/header";
import StatCards from "../StatCards/StatCards";
import SearchBar from "../SearchBar/SearchBar";
import BewerbungsCard from "../BewerbungsCard/BewerbungsCard";
import { DEMO_SEED_DATA, buildDemoStats } from "../../services/api";

const noop = () => {};
const PREVIEW_ITEMS = DEMO_SEED_DATA.slice(0, 3);
const PREVIEW_STATS = buildDemoStats(PREVIEW_ITEMS);
const PREVIEW_USER = { name: "Alex Berger", email: "alex@example.com" };

/** Das echte Dashboard mit Demo-Daten, ohne Funktion (alle Handler sind No-ops). */
function DashboardPreview({ darkMode }) {
  return (
    <section className="app">
      <Header
        darkMode={darkMode}
        toggleDarkMode={noop}
        onNewBewerbung={noop}
        onExportPdf={noop}
        user={PREVIEW_USER}
        onUserUpdate={noop}
      />
      <div className="stat-cards">
        <StatCards stats={PREVIEW_STATS} />
        <SearchBar
          searchQuery=""
          onSearchChange={noop}
          filterStatus="alle"
          onFilterChange={noop}
          sortBy="datum"
          onSortByChange={noop}
          sortDirection="desc"
          onToggleSortDirection={noop}
        />
      </div>
      <section className="bewerbungen-grid">
        {PREVIEW_ITEMS.map((bewerbung) => (
          <BewerbungsCard
            key={bewerbung.id}
            bewerbung={bewerbung}
            onEdit={noop}
            onDelete={noop}
            onStatusChange={noop}
          />
        ))}
      </section>
    </section>
  );
}

export default DashboardPreview;
