import React from 'react';
import { roundCurrency } from '../utils/calculations.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function formatKm(value) {
  return new Intl.NumberFormat('nl-NL', {
    maximumFractionDigits: 1,
  }).format(value);
}

function getQuarter(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Onbekende periode';
  }

  const quarter = Math.floor(date.getMonth() / 3) + 1;

  return `${date.getFullYear()} Q${quarter}`;
}

function createEmptySummary(label) {
  return {
    label,
    trips: 0,
    businessTrips: 0,
    businessKm: 0,
    deductibleAmount: 0,
    incompleteTrips: 0,
  };
}

function summarizeBy(trips, getKey) {
  const summaries = new Map();

  trips.forEach((trip) => {
    const label = getKey(trip) || 'Onbekend';

    if (!summaries.has(label)) {
      summaries.set(label, createEmptySummary(label));
    }

    const summary = summaries.get(label);
    summary.trips += 1;

    if (trip.tripType === 'zakelijk') {
      summary.businessTrips += 1;
    }

    if (trip.countsForDeduction) {
      summary.businessKm += trip.finalKm;
      summary.deductibleAmount += trip.deductibleAmount;
    }

    if (trip.validationStatus === 'incompleet') {
      summary.incompleteTrips += 1;
    }
  });

  return Array.from(summaries.values()).map((summary) => ({
    ...summary,
    businessKm: roundCurrency(summary.businessKm),
    deductibleAmount: roundCurrency(summary.deductibleAmount),
  }));
}

function KpiCard({ label, value, note, tone }) {
  return (
    <article className={tone ? `kpi-card tone-${tone}` : 'kpi-card'}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <p>{note}</p>}
    </article>
  );
}

function SummaryTable({ title, rows, firstColumn }) {
  return (
    <section className="dashboard-section">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="muted-text">Nog geen gegevens.</p>
      ) : (
        <div className="table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>{firstColumn}</th>
                <th>Ritten</th>
                <th>Zakelijke ritten</th>
                <th>Zakelijke km</th>
                <th>Bedrag</th>
                <th>Incompleet</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.trips}</td>
                  <td>{row.businessTrips}</td>
                  <td>{formatKm(row.businessKm)}</td>
                  <td>{formatCurrency(row.deductibleAmount)}</td>
                  <td>{row.incompleteTrips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RecentFiles({ files }) {
  const recentFiles = [...files].slice(0, 5);

  return (
    <section className="dashboard-section">
      <h3>Laatste geïmporteerde bestanden</h3>
      {recentFiles.length === 0 ? (
        <p className="muted-text">Nog geen bestanden geïmporteerd.</p>
      ) : (
        <div className="file-list">
          {recentFiles.map((file) => (
            <article className={`file-card status-${file.status}`} key={file.id}>
              <div className="file-card-header">
                <div>
                  <h4>{file.fileName}</h4>
                  <p>{file.data?.user?.name || 'Gebruiker onbekend'}</p>
                </div>
                <span className={`status-pill status-${file.status}`}>
                  {file.status}
                </span>
              </div>
              <dl className="file-meta-grid compact-grid">
                <div>
                  <dt>Ritten</dt>
                  <dd>{Array.isArray(file.data?.trips) ? file.data.trips.length : 0}</dd>
                </div>
                <div>
                  <dt>Periode</dt>
                  <dd>{file.data?.period?.from || 'onbekend'} t/m {file.data?.period?.to || 'onbekend'}</dd>
                </div>
                <div>
                  <dt>Versie</dt>
                  <dd>{file.data?.exportFormatVersion || 'ontbreekt'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function WarningBlock({ incompleteTrips, duplicateResult, invalidFiles }) {
  const hasWarnings =
    incompleteTrips.length > 0 ||
    duplicateResult.duplicateTripCount > 0 ||
    invalidFiles.length > 0;

  return (
    <section className={hasWarnings ? 'warning-panel' : 'success-panel'}>
      <div>
        <p className="eyebrow">Waarschuwingen</p>
        <h3>{hasWarnings ? 'Aandacht nodig voor boekhouding' : 'Geen waarschuwingen'}</h3>
        <p>
          Incomplete zakelijke ritten tellen niet mee in het definitieve
          boekhoudbedrag. Ze blijven wel zichtbaar voor controle.
        </p>
      </div>

      <div className="warning-grid">
        <article>
          <span>Incomplete ritten</span>
          <strong>{incompleteTrips.length}</strong>
          <p>Niet meegeteld in bedrag</p>
        </article>
        <article>
          <span>Mogelijke dubbele ritten</span>
          <strong>{duplicateResult.duplicateTripCount}</strong>
          <p>{duplicateResult.duplicateGroups.length} groep(en)</p>
        </article>
        <article>
          <span>Ongeldige bestanden</span>
          <strong>{invalidFiles.length}</strong>
          <p>Niet meegenomen</p>
        </article>
      </div>
    </section>
  );
}

export default function DashboardScreen({ duplicateResult, importedFiles, normalizedTrips }) {
  const validFiles = importedFiles.filter((file) => file.status === 'geldig');
  const invalidFiles = importedFiles.filter((file) => file.status === 'ongeldig');
  const users = new Set(normalizedTrips.map((trip) => trip.sourceUserName || trip.userName).filter(Boolean));
  const businessTrips = normalizedTrips.filter((trip) => trip.tripType === 'zakelijk');
  const deductibleTrips = normalizedTrips.filter((trip) => trip.countsForDeduction);
  const incompleteTrips = normalizedTrips.filter((trip) => trip.validationStatus === 'incompleet');
  const totalBusinessKm = roundCurrency(
    deductibleTrips.reduce((total, trip) => total + trip.finalKm, 0),
  );
  const totalDeductibleAmount = roundCurrency(
    deductibleTrips.reduce((total, trip) => total + trip.deductibleAmount, 0),
  );
  const userRows = summarizeBy(normalizedTrips, (trip) => trip.sourceUserName || trip.userName);
  const quarterRows = summarizeBy(normalizedTrips, (trip) => getQuarter(trip.date));
  const customerProjectRows = summarizeBy(normalizedTrips, (trip) => {
    const customer = trip.customer || 'Geen klant';
    const project = trip.project || 'Geen project';

    return `${customer} / ${project}`;
  });

  return (
    <section className="workspace-panel dashboard-panel" aria-labelledby="dashboard-title">
      <div className="panel-heading">
        <p className="eyebrow">Dashboard</p>
        <h2 id="dashboard-title">Boekhoudingsoverzicht</h2>
        <p>
          Definitieve bedragen tellen alleen zakelijke ritten mee zonder
          blokkerende fouten. Privéritten en incomplete ritten blijven
          zichtbaar, maar tellen niet mee voor het boekhoudbedrag.
        </p>
      </div>

      <section className="summary-grid kpi-grid" aria-label="KPI overzicht">
        <KpiCard label="Geïmporteerde bestanden" value={importedFiles.length} />
        <KpiCard label="Geldige bestanden" value={validFiles.length} />
        <KpiCard label="Gebruikers" value={users.size} />
        <KpiCard label="Totaal ritten" value={normalizedTrips.length} />
        <KpiCard label="Zakelijke ritten" value={businessTrips.length} />
        <KpiCard label="Zakelijke kilometers" value={formatKm(totalBusinessKm)} note="Exclusief privé en incompleet" />
        <KpiCard label="Aftrekbaar/declarabel bedrag" value={formatCurrency(totalDeductibleAmount)} note="Incomplete ritten niet meegeteld" />
        <KpiCard label="Incomplete ritten" value={incompleteTrips.length} tone={incompleteTrips.length > 0 ? 'warning' : undefined} />
        <KpiCard label="Mogelijke dubbele ritten" value={duplicateResult.duplicateTripCount} tone={duplicateResult.duplicateTripCount > 0 ? 'warning' : undefined} />
      </section>

      <WarningBlock
        incompleteTrips={incompleteTrips}
        duplicateResult={duplicateResult}
        invalidFiles={invalidFiles}
      />

      <div className="dashboard-columns">
        <SummaryTable title="Samenvatting per gebruiker" rows={userRows} firstColumn="Gebruiker" />
        <SummaryTable title="Samenvatting per kwartaal" rows={quarterRows} firstColumn="Kwartaal" />
      </div>

      <SummaryTable
        title="Samenvatting per klant/project"
        rows={customerProjectRows}
        firstColumn="Klant/project"
      />

      <RecentFiles files={importedFiles} />
    </section>
  );
}
