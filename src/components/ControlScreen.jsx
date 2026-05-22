import React from 'react';

const statusLabels = {
  compleet: 'Compleet',
  incompleet: 'Incompleet',
  waarschuwing: 'Waarschuwing',
  fout: 'Fout',
};

function StatCard({ label, value, note }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <p>{note}</p>}
    </article>
  );
}

function TripMessages({ trip }) {
  const messages = [...trip.validationErrors, ...trip.validationWarnings];

  if (messages.length === 0) {
    return <p className="muted-text">Geen meldingen.</p>;
  }

  return (
    <ul className="message-list compact">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}

function DuplicateGroups({ duplicateResult }) {
  if (duplicateResult.duplicateGroups.length === 0) {
    return <p className="muted-text">Geen mogelijke dubbele ritten gevonden.</p>;
  }

  return (
    <div className="duplicate-group-list">
      {duplicateResult.duplicateGroups.map((group, groupIndex) => (
        <article className="duplicate-group" key={group.id}>
          <div className="file-card-header">
            <div>
              <h4>Mogelijke dubbele groep {groupIndex + 1}</h4>
              <p>{group.reason}</p>
            </div>
            <span className="status-pill status-waarschuwing">
              Mogelijke dubbele rit
            </span>
          </div>

          <div className="trip-message-list">
            {group.trips.map((trip) => (
              <article className="trip-card status-waarschuwing" key={`${group.id}-${trip.duplicateIndex}`}>
                <div className="file-card-header">
                  <div>
                    <h4>{trip.date || 'Datum onbekend'} - {trip.purpose || 'Geen doel'}</h4>
                    <p>{trip.sourceFileName}</p>
                  </div>
                </div>
                <dl className="file-meta-grid compact-grid">
                  <div>
                    <dt>Bronbestand</dt>
                    <dd>{trip.sourceFileName}</dd>
                  </div>
                  <div>
                    <dt>Gebruiker</dt>
                    <dd>{trip.sourceUserName || trip.userName || 'Onbekend'}</dd>
                  </div>
                  <div>
                    <dt>Route</dt>
                    <dd>{trip.startAddress || 'Onbekend'} → {trip.endAddress || 'Onbekend'}</dd>
                  </div>
                  <div>
                    <dt>Kilometers</dt>
                    <dd>{trip.finalKm} km</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ControlScreen({ importedFiles, normalizedTrips, duplicateResult }) {
  const validFiles = importedFiles.filter((file) => file.status === 'geldig');
  const invalidFiles = importedFiles.filter((file) => file.status === 'ongeldig');
  const warningFiles = importedFiles.filter((file) => file.status === 'waarschuwing');
  const completeTrips = normalizedTrips.filter((trip) => trip.validationStatus === 'compleet');
  const incompleteTrips = normalizedTrips.filter((trip) => trip.validationStatus === 'incompleet');
  const warningTrips = normalizedTrips.filter((trip) => trip.validationStatus === 'waarschuwing');
  const errorTrips = normalizedTrips.filter((trip) => trip.validationStatus === 'fout');
  const filesWithMessages = importedFiles.filter(
    (file) => file.errors.length > 0 || file.warnings.length > 0,
  );
  const tripsWithMessages = normalizedTrips.filter(
    (trip) => trip.validationErrors.length > 0 || trip.validationWarnings.length > 0,
  );

  return (
    <section className="workspace-panel" aria-labelledby="controle-title">
      <div className="panel-heading">
        <p className="eyebrow">Controle</p>
        <h2 id="controle-title">Validatie en normalisatie</h2>
        <p>
          Alle ritten uit bruikbare bestanden blijven zichtbaar. Fouten en
          waarschuwingen worden gemarkeerd, maar ritten worden nooit automatisch
          verwijderd.
        </p>
      </div>

      <section className="summary-grid control-grid" aria-label="Controle samenvatting">
        <StatCard label="Bestanden" value={importedFiles.length} />
        <StatCard label="Geldige bestanden" value={validFiles.length} />
        <StatCard label="Bestanden met waarschuwing" value={warningFiles.length} />
        <StatCard label="Ongeldige bestanden" value={invalidFiles.length} />
        <StatCard label="Totaal ritten" value={normalizedTrips.length} />
        <StatCard label="Complete ritten" value={completeTrips.length} />
        <StatCard label="Incomplete ritten" value={incompleteTrips.length} />
        <StatCard label="Ritten met waarschuwingen" value={warningTrips.length} />
        <StatCard label="Ritten met fouten" value={errorTrips.length} />
        <StatCard
          label="Mogelijke dubbele ritten"
          value={duplicateResult.duplicateTripCount}
          note={`${duplicateResult.duplicateGroups.length} groep(en)`}
        />
      </section>

      {importedFiles.length === 0 ? (
        <div className="empty-state">
          <h3>Nog niets te controleren</h3>
          <p>Upload JSON-bestanden of laad voorbeelddata op het Upload-scherm.</p>
        </div>
      ) : (
        <div className="control-layout">
          <section className="control-section">
            <h3>Bestandsmeldingen</h3>
            {filesWithMessages.length === 0 ? (
              <p className="muted-text">Geen bestandsmeldingen.</p>
            ) : (
              <div className="file-list">
                {filesWithMessages.map((file) => (
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
                    <ul className="message-list compact">
                      {[...file.errors, ...file.warnings].map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="control-section">
            <h3>Ritmeldingen</h3>
            {tripsWithMessages.length === 0 ? (
              <p className="muted-text">Geen ritmeldingen.</p>
            ) : (
              <div className="trip-message-list">
                {tripsWithMessages.map((trip, index) => (
                  <article className={`trip-card status-${trip.validationStatus}`} key={`${trip.sourceFileName}-${trip.id}-${index}`}>
                    <div className="file-card-header">
                      <div>
                        <h4>{trip.date || 'Datum onbekend'} - {trip.purpose || 'Geen doel'}</h4>
                        <p>
                          {trip.sourceFileName} · {trip.userName || trip.sourceUserName || 'Gebruiker onbekend'}
                        </p>
                      </div>
                      <span className={`status-pill status-${trip.validationStatus}`}>
                        {statusLabels[trip.validationStatus]}
                      </span>
                    </div>
                    <dl className="file-meta-grid compact-grid">
                      <div>
                        <dt>Route</dt>
                        <dd>{trip.startAddress || 'Onbekend'} → {trip.endAddress || 'Onbekend'}</dd>
                      </div>
                      <div>
                        <dt>Kilometers</dt>
                        <dd>{trip.finalKm} km</dd>
                      </div>
                      <div>
                        <dt>Bedrag</dt>
                        <dd>€ {trip.deductibleAmount.toFixed(2)}</dd>
                      </div>
                    </dl>
                    <TripMessages trip={trip} />
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="control-section">
            <h3>Mogelijke dubbele ritten</h3>
            <DuplicateGroups duplicateResult={duplicateResult} />
          </section>
        </div>
      )}
    </section>
  );
}
