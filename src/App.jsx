import React, { useMemo, useState } from 'react';
import ControlScreen from './components/ControlScreen.jsx';
import CustomerProjectScreen from './components/CustomerProjectScreen.jsx';
import DashboardScreen from './components/DashboardScreen.jsx';
import ExportScreen from './components/ExportScreen.jsx';
import PeriodSummaryScreen from './components/PeriodSummaryScreen.jsx';
import TabButton from './components/TabButton.jsx';
import TripsScreen from './components/TripsScreen.jsx';
import UploadScreen from './components/UploadScreen.jsx';
import UserSummaryScreen from './components/UserSummaryScreen.jsx';
import { tabs } from './data/tabs.js';
import { detectDuplicates } from './utils/detectDuplicates.js';
import { normalizeTrips } from './utils/normalizeTrips.js';
import {
  EXPECTED_APP_NAME,
  SUPPORTED_EXPORT_VERSION,
} from './utils/exportFormat.js';

function EmptyStatePanel({ tab }) {
  return (
    <section className="workspace-panel" aria-labelledby={`${tab.id}-title`}>
      <div className="panel-heading">
        <p className="eyebrow">Module</p>
        <h2 id={`${tab.id}-title`}>{tab.title}</h2>
        <p>{tab.description}</p>
      </div>

      <div className="empty-state">
        <h3>Basis klaar</h3>
        <p>
          Dit scherm is bewust nog leeg opgezet. In de volgende stap kan hier
          de echte import-, controle- of rapportagefunctionaliteit worden
          toegevoegd zonder de navigatiestructuur opnieuw te bouwen.
        </p>
      </div>
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [importedFiles, setImportedFiles] = useState([]);
  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) ?? tabs[0],
    [activeTab],
  );
  const dashboardFiles = importedFiles.filter((file) => file.status !== 'ongeldig');
  const normalizedTrips = useMemo(() => normalizeTrips(importedFiles), [importedFiles]);
  const duplicateResult = useMemo(
    () => detectDuplicates(normalizedTrips),
    [normalizedTrips],
  );
  const usableTrips = dashboardFiles.reduce((total, file) => {
    return total + (Array.isArray(file.data?.trips) ? file.data.trips.length : 0);
  }, 0);
  const controlPointCount = importedFiles.reduce((total, file) => {
    return total + file.errors.length + file.warnings.length;
  }, 0) + normalizedTrips.reduce((total, trip) => {
    return total + trip.validationErrors.length + trip.validationWarnings.length;
  }, 0) + duplicateResult.duplicateTripCount;

  function handleFilesImported(results) {
    setImportedFiles((currentFiles) => [...results, ...currentFiles]);
  }

  function isDemoFile(file) {
    return file.data?.demoData === true || file.fileName.startsWith('demo-');
  }

  function handleDemoFilesImported(results) {
    setImportedFiles((currentFiles) => [
      ...results,
      ...currentFiles.filter((file) => !isDemoFile(file)),
    ]);
  }

  function handleDemoDataCleared() {
    setImportedFiles((currentFiles) => currentFiles.filter((file) => !isDemoFile(file)));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Hoofdnavigatie">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            KM
          </div>
          <div>
            <p>Administratie</p>
            <h1>KM Dashboard</h1>
          </div>
        </div>

        <nav className="tabs" aria-label="Schermen">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              activeTab={activeTab}
              onSelect={setActiveTab}
            />
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Lokale browserapp</p>
            <h2>Bundel kilometerexports zonder backend</h2>
          </div>
          <div className="format-badge">
            <span>Importformaat</span>
            <strong>{EXPECTED_APP_NAME} {SUPPORTED_EXPORT_VERSION}</strong>
          </div>
        </header>

        <section className="summary-grid" aria-label="Status">
          <article>
            <span>Bestanden</span>
            <strong>{dashboardFiles.length}</strong>
            <p>{importedFiles.length === 0 ? 'Nog niets geïmporteerd' : 'Bruikbaar voor dashboard'}</p>
          </article>
          <article>
            <span>Ritten</span>
            <strong>{usableTrips}</strong>
            <p>Uit bruikbare bestanden</p>
          </article>
          <article>
            <span>Controlepunten</span>
            <strong>{controlPointCount}</strong>
            <p>{controlPointCount === 0 ? 'Geen meldingen' : 'Waarschuwingen beschikbaar'}</p>
          </article>
        </section>

        {activeTab === 'upload' ? (
          <UploadScreen
            importedFiles={importedFiles}
            onFilesImported={handleFilesImported}
            onDemoFilesImported={handleDemoFilesImported}
            onDemoDataCleared={handleDemoDataCleared}
          />
        ) : activeTab === 'controle' ? (
          <ControlScreen
            importedFiles={importedFiles}
            normalizedTrips={normalizedTrips}
            duplicateResult={duplicateResult}
          />
        ) : activeTab === 'dashboard' ? (
          <DashboardScreen
            importedFiles={importedFiles}
            normalizedTrips={normalizedTrips}
            duplicateResult={duplicateResult}
          />
        ) : activeTab === 'ritten' ? (
          <TripsScreen normalizedTrips={normalizedTrips} duplicateResult={duplicateResult} />
        ) : activeTab === 'gebruikers' ? (
          <UserSummaryScreen normalizedTrips={normalizedTrips} duplicateResult={duplicateResult} />
        ) : activeTab === 'periodes' ? (
          <PeriodSummaryScreen normalizedTrips={normalizedTrips} duplicateResult={duplicateResult} />
        ) : activeTab === 'klanten' ? (
          <CustomerProjectScreen normalizedTrips={normalizedTrips} duplicateResult={duplicateResult} />
        ) : activeTab === 'export' ? (
          <ExportScreen importedFiles={importedFiles} normalizedTrips={normalizedTrips} duplicateResult={duplicateResult} />
        ) : (
          <EmptyStatePanel tab={currentTab} />
        )}
      </main>
      <footer className="app-footer">
        Lokale verwerking — geen online opslag — controleer je gegevens vóór aanlevering.
      </footer>
    </div>
  );
}
