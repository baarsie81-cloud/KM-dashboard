import React, { useMemo, useState } from 'react';
import { calculateDeductibleAmount, roundCurrency, toNumber } from '../utils/calculations.js';
import { getMonth, getQuarter, getYear, uniqueValues } from '../utils/exportBuilders.js';
import {
  defaultTripFilters,
  filterTripsForTable,
  sortTripsForTable,
} from '../utils/tripTable.js';

const statusLabels = {
  compleet: 'Compleet',
  incompleet: 'Incompleet',
  waarschuwing: 'Waarschuwing',
  fout: 'Fout',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(value ?? 0);
}

function formatKm(value) {
  return new Intl.NumberFormat('nl-NL', {
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function getDuplicateMap(duplicateResult) {
  const map = new Map();

  duplicateResult.duplicateGroups.forEach((group) => {
    group.trips.forEach((trip) => {
      const key = `${trip.sourceFileName}::${trip.id}::${trip.date}`;
      const current = map.get(key) ?? [];
      current.push(group);
      map.set(key, current);
    });
  });

  return map;
}

function getTripDuplicateGroups(trip, duplicateMap) {
  return duplicateMap.get(`${trip.sourceFileName}::${trip.id}::${trip.date}`) ?? [];
}

function CorrectionForm({ onCancel, onSave, trip }) {
  const [formData, setFormData] = useState({
    date: trip.date || '',
    startAddress: trip.startAddress || '',
    endAddress: trip.endAddress || '',
    customer: trip.customer || '',
    project: trip.project || '',
    purpose: trip.purpose || '',
    tripType: trip.tripType || 'zakelijk',
    finalKm: trip.finalKm || '',
    mileageRate: trip.mileageRate || 0.23,
    status: trip.validationStatus === 'compleet' || trip.validationStatus === 'waarschuwing'
      ? 'compleet'
      : trip.status || 'incompleet',
    note: trip.note || '',
  });
  const deductibleAmount = calculateDeductibleAmount(
    formData.finalKm,
    formData.mileageRate,
    formData.tripType,
  );

  function updateField(key, value) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onSave({
      ...formData,
      finalKm: toNumber(formData.finalKm, 0),
      mileageRate: toNumber(formData.mileageRate, 0),
      status: formData.status || 'incompleet',
    });
  }

  return (
    <form className="correction-form" onSubmit={handleSubmit}>
      <div className="correction-form-heading">
        <div>
          <h4>Lokale correctie</h4>
          <p>
            Deze wijziging geldt alleen voor deze dashboardsessie en wijzigt het
            originele JSON-bestand niet.
          </p>
        </div>
        <span className="demo-pill">Tijdelijk</span>
      </div>

      <div className="correction-grid">
        <label>
          Datum
          <input type="date" value={formData.date} onChange={(event) => updateField('date', event.target.value)} />
        </label>
        <label>
          Type rit
          <select value={formData.tripType} onChange={(event) => updateField('tripType', event.target.value)}>
            <option value="zakelijk">Zakelijk</option>
            <option value="privé">Privé</option>
          </select>
        </label>
        <label>
          Status
          <select value={formData.status} onChange={(event) => updateField('status', event.target.value)}>
            <option value="compleet">Compleet</option>
            <option value="incompleet">Incompleet</option>
          </select>
        </label>
        <label>
          Kilometers
          <input type="number" min="0" step="0.1" value={formData.finalKm} onChange={(event) => updateField('finalKm', event.target.value)} />
        </label>
        <label>
          Tarief
          <input type="number" min="0" step="0.01" value={formData.mileageRate} onChange={(event) => updateField('mileageRate', event.target.value)} />
        </label>
        <label>
          Berekend bedrag
          <input type="text" value={formatCurrency(roundCurrency(deductibleAmount))} readOnly />
        </label>
        <label className="wide-field">
          Startadres
          <input type="text" value={formData.startAddress} onChange={(event) => updateField('startAddress', event.target.value)} />
        </label>
        <label className="wide-field">
          Eindadres
          <input type="text" value={formData.endAddress} onChange={(event) => updateField('endAddress', event.target.value)} />
        </label>
        <label>
          Klant
          <input type="text" value={formData.customer} onChange={(event) => updateField('customer', event.target.value)} />
        </label>
        <label>
          Project
          <input type="text" value={formData.project} onChange={(event) => updateField('project', event.target.value)} />
        </label>
        <label className="wide-field">
          Doel
          <input type="text" value={formData.purpose} onChange={(event) => updateField('purpose', event.target.value)} />
        </label>
        <label className="full-field">
          Notitie
          <textarea value={formData.note} onChange={(event) => updateField('note', event.target.value)} rows="3" />
        </label>
      </div>

      <div className="form-actions">
        <button className="primary-button" type="submit">
          Correctie opslaan
        </button>
        <button className="secondary-button" type="button" onClick={onCancel}>
          Annuleren
        </button>
      </div>
    </form>
  );
}

function DetailPanel({ duplicateGroups, onClose, onCorrectionSaved, trip }) {
  const [isEditing, setIsEditing] = useState(false);
  const fields = Object.entries(trip).filter(([, value]) => {
    return !Array.isArray(value) && typeof value !== 'object';
  });
  const messages = [...trip.validationErrors, ...trip.validationWarnings];

  return (
    <section className="detail-panel" aria-labelledby="trip-detail-title">
      <div className="file-card-header">
        <div>
          <p className="eyebrow">Ritdetail</p>
          <h3 id="trip-detail-title">{trip.date || 'Datum onbekend'} - {trip.purpose || 'Geen doel'}</h3>
          <p>{trip.sourceFileName}</p>
          {trip.localCorrection && <span className="inline-warning">Lokaal gecorrigeerd</span>}
        </div>
        <div className="panel-actions">
          <button className="primary-button" type="button" onClick={() => setIsEditing(true)}>
            Lokale correctie maken
          </button>
          <button className="secondary-button" type="button" onClick={onClose}>
            Sluiten
          </button>
        </div>
      </div>

      {isEditing && (
        <CorrectionForm
          trip={trip}
          onCancel={() => setIsEditing(false)}
          onSave={(correction) => {
            onCorrectionSaved(trip, correction);
            setIsEditing(false);
          }}
        />
      )}

      <dl className="detail-grid">
        {fields.map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value === '' || value === null || value === undefined ? 'Niet ingevuld' : String(value)}</dd>
          </div>
        ))}
      </dl>

      <section className="control-section">
        <h4>Validatiemeldingen</h4>
        {messages.length === 0 ? (
          <p className="muted-text">Geen validatiemeldingen.</p>
        ) : (
          <ul className="message-list compact">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="control-section">
        <h4>Dubbele rit-waarschuwing</h4>
        {duplicateGroups.length === 0 ? (
          <p className="muted-text">Geen mogelijke dubbele rit gevonden.</p>
        ) : (
          <div className="duplicate-group-list">
            {duplicateGroups.map((group) => (
              <article className="duplicate-group" key={group.id}>
                <h4>Mogelijke dubbele rit</h4>
                <p>{group.reason}</p>
                <ul className="message-list compact">
                  {group.trips.map((duplicateTrip) => (
                    <li key={`${group.id}-${duplicateTrip.duplicateIndex}`}>
                      {duplicateTrip.sourceFileName} - {duplicateTrip.date} - {duplicateTrip.startAddress} naar {duplicateTrip.endAddress}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default function TripsScreen({ normalizedTrips, duplicateResult, onTripCorrectionSaved }) {
  const [filters, setFilters] = useState(defaultTripFilters);
  const [sortConfig, setSortConfig] = useState({ by: 'datum', direction: 'desc' });
  const [selectedTripKey, setSelectedTripKey] = useState('');
  const duplicateMap = useMemo(() => getDuplicateMap(duplicateResult), [duplicateResult]);

  const options = useMemo(() => {
    return {
      users: uniqueValues(normalizedTrips.map((trip) => trip.sourceUserName || trip.userName)),
      years: uniqueValues(normalizedTrips.map((trip) => getYear(trip.date))).reverse(),
      months: uniqueValues(normalizedTrips.map((trip) => getMonth(trip.date))),
      quarters: ['1', '2', '3', '4'],
      customers: uniqueValues(normalizedTrips.map((trip) => trip.customer)),
      projects: uniqueValues(normalizedTrips.map((trip) => trip.project)),
      sourceFiles: uniqueValues(normalizedTrips.map((trip) => trip.sourceFileName)),
    };
  }, [normalizedTrips]);

  const filteredTrips = useMemo(() => {
    return sortTripsForTable(filterTripsForTable(normalizedTrips, filters), sortConfig);
  }, [filters, normalizedTrips, sortConfig]);

  const selectedTrip = filteredTrips.find((trip, index) => {
    return `${trip.sourceFileName}-${trip.id}-${index}` === selectedTripKey;
  });

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setSelectedTripKey('');
  }

  function handleSort(by) {
    setSortConfig((current) => {
      if (current.by === by) {
        return {
          by,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return { by, direction: by === 'datum' ? 'desc' : 'asc' };
    });
  }

  function renderSortLabel(label, by) {
    if (sortConfig.by !== by) {
      return label;
    }

    return `${label} ${sortConfig.direction === 'asc' ? 'oplopend' : 'aflopend'}`;
  }

  return (
    <section className="workspace-panel trips-panel" aria-labelledby="ritten-title">
      <div className="panel-heading">
        <p className="eyebrow">Alle ritten</p>
        <h2 id="ritten-title">Gecombineerde rittenlijst</h2>
        <p>
          Zoek, filter en controleer alle genormaliseerde ritten uit bruikbare
          JSON-bestanden. Klik op een rij voor alle velden en meldingen.
        </p>
      </div>

      <section className="filters-panel" aria-label="Rittenfilters">
        <label>
          Zoeken
          <input
            type="search"
            value={filters.search}
            placeholder="Adres, klant, project, doel of gebruiker"
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </label>
        <label>
          Gebruiker
          <select value={filters.user} onChange={(event) => updateFilter('user', event.target.value)}>
            <option value="">Alle gebruikers</option>
            {options.users.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Jaar
          <select value={filters.year} onChange={(event) => updateFilter('year', event.target.value)}>
            <option value="">Alle jaren</option>
            {options.years.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Maand
          <select value={filters.month} onChange={(event) => updateFilter('month', event.target.value)}>
            <option value="">Alle maanden</option>
            {options.months.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Kwartaal
          <select value={filters.quarter} onChange={(event) => updateFilter('quarter', event.target.value)}>
            <option value="">Alle kwartalen</option>
            {options.quarters.map((value) => <option key={value} value={value}>Q{value}</option>)}
          </select>
        </label>
        <label>
          Klant
          <select value={filters.customer} onChange={(event) => updateFilter('customer', event.target.value)}>
            <option value="">Alle klanten</option>
            {options.customers.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Project
          <select value={filters.project} onChange={(event) => updateFilter('project', event.target.value)}>
            <option value="">Alle projecten</option>
            {options.projects.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Type rit
          <select value={filters.tripType} onChange={(event) => updateFilter('tripType', event.target.value)}>
            <option value="">Alle typen</option>
            <option value="zakelijk">Zakelijk</option>
            <option value="privé">Privé</option>
          </select>
        </label>
        <label>
          Status
          <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            <option value="">Alle statussen</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Bronbestand
          <select value={filters.sourceFileName} onChange={(event) => updateFilter('sourceFileName', event.target.value)}>
            <option value="">Alle bestanden</option>
            {options.sourceFiles.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </section>

      <div className="table-toolbar">
        <p>{filteredTrips.length} van {normalizedTrips.length} ritten zichtbaar</p>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setFilters(defaultTripFilters);
            setSelectedTripKey('');
          }}
        >
          Filters wissen
        </button>
      </div>

      <div className="table-wrap trips-table-wrap">
        <table className="dashboard-table trips-table">
          <thead>
            <tr>
              <th><button type="button" onClick={() => handleSort('gebruiker')}>{renderSortLabel('Gebruiker', 'gebruiker')}</button></th>
              <th><button type="button" onClick={() => handleSort('datum')}>{renderSortLabel('Datum', 'datum')}</button></th>
              <th>Starttijd</th>
              <th>Eindtijd</th>
              <th>Startadres</th>
              <th>Eindadres</th>
              <th>Klant</th>
              <th>Project</th>
              <th>Doel</th>
              <th>Type rit</th>
              <th><button type="button" onClick={() => handleSort('kilometers')}>{renderSortLabel('Kilometers', 'kilometers')}</button></th>
              <th>Tarief</th>
              <th><button type="button" onClick={() => handleSort('bedrag')}>{renderSortLabel('Bedrag', 'bedrag')}</button></th>
              <th>Status</th>
              <th>Bronbestand</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.length === 0 ? (
              <tr>
                <td colSpan="15">Geen ritten gevonden met deze filters.</td>
              </tr>
            ) : (
              filteredTrips.map((trip, index) => {
                const rowKey = `${trip.sourceFileName}-${trip.id}-${index}`;
                const duplicateGroups = getTripDuplicateGroups(trip, duplicateMap);

                return (
                  <tr
                    className={selectedTripKey === rowKey ? 'selected-row' : ''}
                    key={rowKey}
                    onClick={() => setSelectedTripKey(rowKey)}
                  >
                    <td>{trip.sourceUserName || trip.userName || 'Onbekend'}</td>
                    <td>{trip.date || '-'}</td>
                    <td>{trip.startTime || '-'}</td>
                    <td>{trip.endTime || '-'}</td>
                    <td>{trip.startAddress || '-'}</td>
                    <td>{trip.endAddress || '-'}</td>
                    <td>{trip.customer || '-'}</td>
                    <td>{trip.project || '-'}</td>
                    <td>{trip.purpose || '-'}</td>
                    <td>{trip.tripType || '-'}</td>
                    <td>{formatKm(trip.finalKm)} km</td>
                    <td>{formatCurrency(trip.mileageRate)}</td>
                    <td>{formatCurrency(trip.deductibleAmount)}</td>
                    <td>
                      <span className={`status-pill status-${trip.validationStatus}`}>
                        {statusLabels[trip.validationStatus] || trip.validationStatus}
                      </span>
                      {trip.localCorrection && (
                        <span className="inline-warning">Gecorrigeerd</span>
                      )}
                      {duplicateGroups.length > 0 && (
                        <span className="inline-warning">Dubbel?</span>
                      )}
                    </td>
                    <td>{trip.sourceFileName}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedTrip && (
        <DetailPanel
          trip={selectedTrip}
          duplicateGroups={getTripDuplicateGroups(selectedTrip, duplicateMap)}
          onClose={() => setSelectedTripKey('')}
          onCorrectionSaved={onTripCorrectionSaved}
        />
      )}
    </section>
  );
}
