import React, { useMemo, useState } from 'react';
import { roundCurrency } from '../utils/calculations.js';

function formatCurrency(value) { return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value ?? 0); }
function formatKm(value) { return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(value ?? 0); }
function getYear(dateValue) { return dateValue ? String(dateValue).slice(0, 4) : ''; }
function getMonth(dateValue) { return dateValue ? String(dateValue).slice(5, 7) : ''; }
function getQuarter(dateValue) { const month = Number(getMonth(dateValue)); return month ? String(Math.floor((month - 1) / 3) + 1) : ''; }
function uniqueValues(values) { return Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'nl-NL')); }

function summarizeTrips(label, trips) {
  const businessTrips = trips.filter((trip) => trip.tripType === 'zakelijk');
  const privateTrips = trips.filter((trip) => trip.tripType === 'privé');
  const incompleteTrips = trips.filter((trip) => trip.validationStatus === 'incompleet');
  const deductibleTrips = trips.filter((trip) => trip.countsForDeduction);
  const businessKm = roundCurrency(deductibleTrips.reduce((total, trip) => total + trip.finalKm, 0));
  const totalAmount = roundCurrency(deductibleTrips.reduce((total, trip) => total + trip.deductibleAmount, 0));
  return { label, totalTrips: trips.length, businessTrips: businessTrips.length, privateTrips: privateTrips.length, incompleteTrips: incompleteTrips.length, businessKm, totalAmount, averageBusinessKm: deductibleTrips.length > 0 ? roundCurrency(businessKm / deductibleTrips.length) : 0 };
}

function summarizeBy(trips, getKey) {
  const map = new Map();
  trips.forEach((trip) => { const key = getKey(trip) || 'Onbekend'; const rows = map.get(key) ?? []; rows.push(trip); map.set(key, rows); });
  return Array.from(map.entries()).map(([key, rows]) => summarizeTrips(key, rows)).sort((a, b) => String(a.label).localeCompare(String(b.label), 'nl-NL'));
}

function getDuplicateGroupsForUser(duplicateResult, userName) { return duplicateResult.duplicateGroups.filter((group) => group.trips.some((trip) => (trip.sourceUserName || trip.userName) === userName)); }

function SummaryTable({ title, firstColumn, rows }) {
  return <section className="dashboard-section"><h4>{title}</h4>{rows.length === 0 ? <p className="muted-text">Geen gegevens.</p> : <div className="table-wrap"><table className="dashboard-table"><thead><tr><th>{firstColumn}</th><th>Ritten</th><th>Zakelijke ritten</th><th>Privéritten</th><th>Zakelijke km</th><th>Bedrag</th><th>Incompleet</th></tr></thead><tbody>{rows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.totalTrips}</td><td>{row.businessTrips}</td><td>{row.privateTrips}</td><td>{formatKm(row.businessKm)}</td><td>{formatCurrency(row.totalAmount)}</td><td>{row.incompleteTrips}</td></tr>)}</tbody></table></div>}</section>;
}

function UserDetail({ user, duplicateGroups }) {
  const monthlyRows = summarizeBy(user.trips, (trip) => { const year = getYear(trip.date); const month = getMonth(trip.date); return year && month ? `${year}-${month}` : 'Onbekend'; });
  const quarterRows = summarizeBy(user.trips, (trip) => { const year = getYear(trip.date); const quarter = getQuarter(trip.date); return year && quarter ? `${year} Q${quarter}` : 'Onbekend'; });
  const customerProjectRows = summarizeBy(user.trips, (trip) => `${trip.customer || 'Geen klant'} / ${trip.project || 'Geen project'}`);
  return <div className="user-detail"><div className="dashboard-columns"><SummaryTable title="Totalen per maand" firstColumn="Maand" rows={monthlyRows} /><SummaryTable title="Totalen per kwartaal" firstColumn="Kwartaal" rows={quarterRows} /></div><SummaryTable title="Totalen per klant/project" firstColumn="Klant/project" rows={customerProjectRows} /><section className="dashboard-section"><h4>Incomplete ritten van deze gebruiker</h4>{user.incompleteTripList.length === 0 ? <p className="muted-text">Geen incomplete ritten.</p> : <div className="trip-message-list">{user.incompleteTripList.map((trip) => <article className="trip-card status-incompleet" key={`${trip.sourceFileName}-${trip.id}`}><div className="file-card-header"><div><h4>{trip.date || 'Datum onbekend'} - {trip.purpose || 'Geen doel'}</h4><p>{trip.sourceFileName}</p></div><span className="status-pill status-incompleet">Nog controleren</span></div><ul className="message-list compact">{trip.validationErrors.map((message) => <li key={message}>{message}</li>)}</ul></article>)}</div>}</section><section className="dashboard-section"><h4>Mogelijke dubbele ritten van deze gebruiker</h4>{duplicateGroups.length === 0 ? <p className="muted-text">Geen mogelijke dubbele ritten.</p> : <div className="duplicate-group-list">{duplicateGroups.map((group) => <article className="duplicate-group" key={group.id}><h4>Mogelijke dubbele rit</h4><p>{group.reason}</p><ul className="message-list compact">{group.trips.map((trip) => <li key={`${group.id}-${trip.duplicateIndex}`}>{trip.sourceFileName} - {trip.date} - {trip.startAddress} naar {trip.endAddress}</li>)}</ul></article>)}</div>}</section></div>;
}

function buildUserSummaries(trips) {
  const map = new Map();
  trips.forEach((trip) => { const userName = trip.sourceUserName || trip.userName || 'Onbekend'; const current = map.get(userName) ?? { name: userName, vehicle: trip.sourceVehicle || '', licensePlate: trip.sourceLicensePlate || '', sourceFiles: new Set(), trips: [], incompleteTrips: [] }; current.sourceFiles.add(trip.sourceFileName); current.trips.push(trip); if (trip.validationStatus === 'incompleet') current.incompleteTrips.push(trip); map.set(userName, current); });
  return Array.from(map.values()).map((user) => { const summary = summarizeTrips(user.name, user.trips); const dates = user.trips.map((trip) => trip.date).filter(Boolean).sort(); return { ...user, ...summary, incompleteTripList: user.incompleteTrips, fileCount: user.sourceFiles.size, firstDate: dates[0] || '', lastDate: dates[dates.length - 1] || '' }; });
}

export default function UserSummaryScreen({ normalizedTrips, duplicateResult }) {
  const [filters, setFilters] = useState({ year: '', quarter: '', month: '', user: '' });
  const [openUsers, setOpenUsers] = useState({});
  const options = useMemo(() => ({ users: uniqueValues(normalizedTrips.map((trip) => trip.sourceUserName || trip.userName)), years: uniqueValues(normalizedTrips.map((trip) => getYear(trip.date))).reverse(), months: uniqueValues(normalizedTrips.map((trip) => getMonth(trip.date))) }), [normalizedTrips]);
  const filteredTrips = useMemo(() => normalizedTrips.filter((trip) => { const userName = trip.sourceUserName || trip.userName; return (!filters.user || userName === filters.user) && (!filters.year || getYear(trip.date) === filters.year) && (!filters.month || getMonth(trip.date) === filters.month) && (!filters.quarter || getQuarter(trip.date) === filters.quarter); }), [filters, normalizedTrips]);
  const userSummaries = useMemo(() => buildUserSummaries(filteredTrips), [filteredTrips]);
  function updateFilter(key, value) { setFilters((current) => ({ ...current, [key]: value })); }
  return <section className="workspace-panel user-panel" aria-labelledby="gebruikers-title"><div className="panel-heading"><p className="eyebrow">Per gebruiker</p><h2 id="gebruikers-title">Overzicht per persoon</h2><p>Complete zakelijke ritten tellen mee voor kilometers en bedrag. Incomplete zakelijke ritten staan apart als nog controleren.</p></div><section className="filters-panel compact-filters" aria-label="Gebruikersfilters"><label>Jaar<select value={filters.year} onChange={(event) => updateFilter('year', event.target.value)}><option value="">Alle jaren</option>{options.years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Kwartaal<select value={filters.quarter} onChange={(event) => updateFilter('quarter', event.target.value)}><option value="">Alle kwartalen</option>{['1', '2', '3', '4'].map((value) => <option key={value} value={value}>Q{value}</option>)}</select></label><label>Maand<select value={filters.month} onChange={(event) => updateFilter('month', event.target.value)}><option value="">Alle maanden</option>{options.months.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Gebruiker<select value={filters.user} onChange={(event) => updateFilter('user', event.target.value)}><option value="">Alle gebruikers</option>{options.users.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></section>{userSummaries.length === 0 ? <div className="empty-state"><h3>Geen gebruikers gevonden</h3><p>Upload JSON-bestanden of pas de filters aan.</p></div> : <div className="user-list">{userSummaries.map((user) => { const isOpen = Boolean(openUsers[user.name]); const duplicateGroups = getDuplicateGroupsForUser(duplicateResult, user.name); return <article className="user-card" key={user.name}><div className="file-card-header"><div><h3>{user.name}</h3><p>{user.vehicle || 'Voertuig onbekend'}{user.licensePlate ? ` · ${user.licensePlate}` : ''}</p></div><button className="secondary-button" type="button" onClick={() => setOpenUsers((current) => ({ ...current, [user.name]: !isOpen }))}>{isOpen ? 'Details sluiten' : 'Details openen'}</button></div><dl className="user-kpi-grid"><div><dt>Bestanden</dt><dd>{user.fileCount}</dd></div><div><dt>Ritten totaal</dt><dd>{user.totalTrips}</dd></div><div><dt>Zakelijke ritten</dt><dd>{user.businessTrips}</dd></div><div><dt>Privéritten</dt><dd>{user.privateTrips}</dd></div><div><dt>Incomplete ritten</dt><dd>{user.incompleteTrips}</dd></div><div><dt>Zakelijke km</dt><dd>{formatKm(user.businessKm)}</dd></div><div><dt>Totaal bedrag</dt><dd>{formatCurrency(user.totalAmount)}</dd></div><div><dt>Gem. km per zakelijke rit</dt><dd>{formatKm(user.averageBusinessKm)}</dd></div><div><dt>Periode</dt><dd>{user.firstDate || 'onbekend'} t/m {user.lastDate || 'onbekend'}</dd></div></dl>{user.incompleteTrips > 0 && <div className="inline-note">{user.incompleteTrips} rit(ten) nog controleren. Deze tellen niet mee in het definitieve bedrag.</div>}{isOpen && <UserDetail user={user} duplicateGroups={duplicateGroups} />}</article>; })}</div>}</section>;
}
