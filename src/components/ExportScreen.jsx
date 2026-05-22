import React, { useMemo, useState } from 'react';
import {
  buildAllTripsCsv,
  buildBookkeeperCsv,
  buildCombinedJsonBackup,
  buildSummaryCsv,
  downloadFile,
  filterTripsByExportOptions,
  formatPeriodSuffix,
  getExportSummary,
  getMonth,
  getQuarter,
  getYear,
  uniqueValues,
} from '../utils/exportBuilders.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(value ?? 0);
}

export default function ExportScreen({ importedFiles, normalizedTrips, duplicateResult }) {
  const [options, setOptions] = useState({
    periodType: 'all',
    year: '',
    quarter: '',
    month: '',
    user: '',
    customer: '',
    project: '',
  });

  const filterOptions = useMemo(() => ({
    years: uniqueValues(normalizedTrips.map((trip) => getYear(trip.date))).reverse(),
    months: uniqueValues(normalizedTrips.map((trip) => getMonth(trip.date)),
    ),
    users: uniqueValues(normalizedTrips.map((trip) => trip.sourceUserName || trip.userName)),
    customers: uniqueValues(normalizedTrips.map((trip) => trip.customer)),
    projects: uniqueValues(normalizedTrips.map((trip) => trip.project)),
  }), [normalizedTrips]);
  const filteredTrips = useMemo(
    () => filterTripsByExportOptions(normalizedTrips, options),
    [normalizedTrips, options],
  );
  const periodSuffix = formatPeriodSuffix(
    options.periodType,
    options.year,
    options.quarter,
    options.month,
  );
  const periodLabel = periodSuffix === 'alles' ? 'Alles' : periodSuffix;
  const summary = getExportSummary(filteredTrips, duplicateResult);

  function updateOption(key, value) {
    setOptions((current) => ({
      ...current,
      [key]: value,
      ...(key === 'periodType' && value === 'all' ? { year: '', quarter: '', month: '' } : {}),
      ...(key === 'periodType' && value === 'year' ? { quarter: '', month: '' } : {}),
      ...(key === 'periodType' && value === 'quarter' ? { month: '' } : {}),
    }));
  }

  function downloadCsv(type) {
    const builders = {
      'alle-ritten': () => buildAllTripsCsv(filteredTrips),
      boekhouder: () => buildBookkeeperCsv(filteredTrips, periodLabel, duplicateResult),
      'per-gebruiker': () => buildSummaryCsv(filteredTrips, 'Gebruiker', (trip) => trip.sourceUserName || trip.userName),
      'per-maand': () => buildSummaryCsv(filteredTrips, 'Maand', (trip) => `${getYear(trip.date)}-${getMonth(trip.date)}`),
      'per-kwartaal': () => buildSummaryCsv(filteredTrips, 'Kwartaal', (trip) => `${getYear(trip.date)} Q${getQuarter(trip.date)}`),
      'klant-project': () => buildSummaryCsv(filteredTrips, 'Klant/project', (trip) => `${trip.customer || 'Geen klant ingevuld'} / ${trip.project || 'Geen project ingevuld'}`),
    };

    downloadFile(
      `km-bundel-${type}-${periodSuffix}.csv`,
      builders[type](),
      'text/csv;charset=utf-8',
    );
  }

  function downloadJsonBackup() {
    const backup = buildCombinedJsonBackup({
      filteredTrips,
      importedFiles,
      options,
      summary,
    });

    downloadFile(
      `km-bundel-backup-${periodSuffix}.json`,
      JSON.stringify(backup, null, 2),
      'application/json;charset=utf-8',
    );
  }

  return (
    <section className="workspace-panel export-panel" aria-labelledby="export-title">
      <div className="panel-heading">
        <p className="eyebrow">Export</p>
        <h2 id="export-title">Gecombineerde exports maken</h2>
        <p>
          Exporteer alleen data die lokaal in deze browser is geïmporteerd. Er
          wordt niets online opgeslagen of verstuurd.
        </p>
      </div>

      <section className="privacy-notice" aria-label="Controle voor delen">
        <h3>Controle voor aanlevering</h3>
        <p>
          Controleer exports voordat je ze deelt met boekhouder of
          administratie. Incomplete of dubbele ritten worden niet automatisch
          verwijderd. Het dashboard signaleert waarschuwingen; de gebruiker
          blijft verantwoordelijk voor de inhoudelijke controle.
        </p>
      </section>

      <section className="filters-panel" aria-label="Exportfilters">
        <label>
          Periode
          <select value={options.periodType} onChange={(event) => updateOption('periodType', event.target.value)}>
            <option value="all">Alles</option>
            <option value="year">Jaar</option>
            <option value="quarter">Kwartaal</option>
            <option value="month">Maand</option>
          </select>
        </label>
        {options.periodType !== 'all' && (
          <label>
            Jaar
            <select value={options.year} onChange={(event) => updateOption('year', event.target.value)}>
              <option value="">Kies jaar</option>
              {filterOptions.years.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
        {options.periodType === 'quarter' && (
          <label>
            Kwartaal
            <select value={options.quarter} onChange={(event) => updateOption('quarter', event.target.value)}>
              <option value="">Kies kwartaal</option>
              {['1', '2', '3', '4'].map((value) => <option key={value} value={value}>Q{value}</option>)}
            </select>
          </label>
        )}
        {options.periodType === 'month' && (
          <label>
            Maand
            <select value={options.month} onChange={(event) => updateOption('month', event.target.value)}>
              <option value="">Kies maand</option>
              {filterOptions.months.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
        <label>
          Gebruiker
          <select value={options.user} onChange={(event) => updateOption('user', event.target.value)}>
            <option value="">Alle gebruikers</option>
            {filterOptions.users.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Klant
          <select value={options.customer} onChange={(event) => updateOption('customer', event.target.value)}>
            <option value="">Alle klanten</option>
            {filterOptions.customers.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Project
          <select value={options.project} onChange={(event) => updateOption('project', event.target.value)}>
            <option value="">Alle projecten</option>
            {filterOptions.projects.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </section>

      <section className="summary-grid kpi-grid" aria-label="Exportsamenvatting">
        <article><span>Ritten in export</span><strong>{summary.totalTrips}</strong><p>Na filters</p></article>
        <article><span>Meetellende zakelijke ritten</span><strong>{summary.completeBusinessTrips}</strong><p>Exclusief privé en incompleet</p></article>
        <article><span>Zakelijke km</span><strong>{summary.businessKm}</strong><p>Definitief</p></article>
        <article><span>Totaal bedrag</span><strong>{formatCurrency(summary.totalAmount)}</strong><p>Incomplete ritten niet meegeteld</p></article>
        <article><span>Incomplete ritten</span><strong>{summary.incompleteTrips}</strong><p>Niet in definitief bedrag</p></article>
        <article><span>Mogelijke dubbele ritten</span><strong>{summary.duplicateTrips}</strong><p>Controleer voor versturen</p></article>
      </section>

      <section className="export-actions" aria-label="Exportacties">
        <button type="button" className="primary-button" onClick={() => downloadCsv('alle-ritten')}>Gecombineerde CSV met alle ritten</button>
        <button type="button" className="primary-button" onClick={() => downloadCsv('boekhouder')}>Boekhouder-samenvatting CSV</button>
        <button type="button" className="secondary-button" onClick={() => downloadCsv('per-gebruiker')}>Overzicht per gebruiker CSV</button>
        <button type="button" className="secondary-button" onClick={() => downloadCsv('per-maand')}>Overzicht per maand CSV</button>
        <button type="button" className="secondary-button" onClick={() => downloadCsv('per-kwartaal')}>Overzicht per kwartaal CSV</button>
        <button type="button" className="secondary-button" onClick={() => downloadCsv('klant-project')}>Overzicht per klant/project CSV</button>
        <button type="button" className="secondary-button" onClick={downloadJsonBackup}>Gecombineerde JSON-backup</button>
      </section>
    </section>
  );
}
