import React, { useRef, useState } from 'react';
import { sampleExports } from '../data/sampleExports.js';
import { parseJsonFiles } from '../utils/parseJsonFiles.js';
import { validateExportFile } from '../utils/validateExportFile.js';

const statusLabels = {
  geldig: 'Geldig',
  waarschuwing: 'Waarschuwing',
  ongeldig: 'Ongeldig',
};

function formatDateTime(value) {
  if (!value) {
    return 'Onbekend';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatPeriod(period) {
  const from = period?.from || 'onbekend';
  const to = period?.to || 'onbekend';

  return `${from} t/m ${to}`;
}

function FileResultCard({ onRemove, result }) {
  const { data, fileName, status, errors, warnings } = result;
  const user = data?.user ?? {};
  const tripCount = Array.isArray(data?.trips) ? data.trips.length : 0;
  const messages = [...errors, ...warnings];

  return (
    <article className={`file-card status-${status}`}>
      <div className="file-card-header">
        <div>
          <h3>{fileName}</h3>
          <p>{user.name || 'Gebruiker onbekend'}</p>
        </div>
        <div className="file-card-actions">
          <span className={`status-pill status-${status}`}>
            {statusLabels[status]}
          </span>
          {data?.demoData && <span className="demo-pill">Demo</span>}
          <button className="secondary-button compact-button" type="button" onClick={() => onRemove(result.id)}>
            Verwijderen
          </button>
        </div>
      </div>

      <dl className="file-meta-grid">
        <div>
          <dt>Voertuig</dt>
          <dd>{user.vehicle || 'Onbekend'}</dd>
        </div>
        <div>
          <dt>Kenteken</dt>
          <dd>{user.licensePlate || 'Niet ingevuld'}</dd>
        </div>
        <div>
          <dt>Periode</dt>
          <dd>{formatPeriod(data?.period)}</dd>
        </div>
        <div>
          <dt>Exportdatum</dt>
          <dd>{formatDateTime(data?.exportedAt)}</dd>
        </div>
        <div>
          <dt>Exportversie</dt>
          <dd>{data?.exportFormatVersion || 'Ontbreekt'}</dd>
        </div>
        <div>
          <dt>Aantal ritten</dt>
          <dd>{tripCount}</dd>
        </div>
      </dl>

      {messages.length > 0 && (
        <ul className="message-list" aria-label={`Meldingen voor ${fileName}`}>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function UploadScreen({
  importedFiles,
  onFilesImported,
  onDemoFilesImported,
  onDemoDataCleared,
  onFileRemoved,
  onAllImportsCleared,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

  async function handleFiles(files) {
    if (!files || files.length === 0) {
      return;
    }

    const results = await parseJsonFiles(files);
    onFilesImported(results);
    setUploadMessage(`${results.length} bestand(en) lokaal gelezen.`);
  }

  function handleSampleExports() {
    const results = sampleExports.map((sample) =>
      validateExportFile(sample.data, sample.fileName),
    );

    onDemoFilesImported(results);
    setUploadMessage(`${results.length} demo-export(s) geladen.`);
  }

  function handleClearDemoData() {
    onDemoDataCleared();
    setUploadMessage('Demo-data gewist uit de huidige importlijst.');
  }

  function handleRemoveFile(fileId) {
    onFileRemoved(fileId);
    setUploadMessage('Bestand verwijderd uit de huidige importlijst.');
  }

  function handleClearAllImports() {
    if (!window.confirm('Weet je zeker dat je alle imports uit deze dashboardsessie wilt wissen?')) {
      return;
    }

    onAllImportsCleared();
    setUploadMessage('Alle imports zijn uit de huidige dashboardsessie gewist.');
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  const validForDashboard = importedFiles.filter(
    (file) => file.status !== 'ongeldig',
  ).length;
  const demoFileCount = importedFiles.filter(
    (file) => file.data?.demoData === true || file.fileName.startsWith('demo-'),
  ).length;

  return (
    <section className="workspace-panel" aria-labelledby="upload-title">
      <div className="panel-heading panel-heading-row">
        <div>
          <p className="eyebrow">Upload</p>
          <h2 id="upload-title">JSON-bestanden uploaden</h2>
          <p>
            Lees lokale exports uit Zakelijke KM Logger in. Alles blijft in de
            browser; originele bestanden worden niet aangepast.
          </p>
        </div>
        <div className="panel-actions">
          <button className="secondary-button" type="button" onClick={handleSampleExports}>
            Voorbeelddata laden
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={handleClearAllImports}
            disabled={importedFiles.length === 0}
          >
            Alle imports wissen
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={handleClearDemoData}
            disabled={demoFileCount === 0}
          >
            Demo-data wissen
          </button>
        </div>
      </div>

      <section className="privacy-notice" aria-label="Privacy en verwerking">
        <h3>Lokale verwerking van ritgegevens</h3>
        <p>
          Alle bestanden worden lokaal in de browser verwerkt. Er wordt niets
          online opgeslagen. Upload alleen JSON-bestanden die je mag verwerken.
          Ritgegevens kunnen adressen, klantnamen en werktijden bevatten.
        </p>
      </section>

      <div
        className={`drop-zone ${isDragging ? 'is-dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          className="file-input"
          type="file"
          accept="application/json,.json"
          multiple
          onChange={(event) => handleFiles(event.target.files)}
        />
        <h3>Sleep JSON-bestanden hierheen</h3>
        <p>Of kies handmatig meerdere exportbestanden vanaf je computer.</p>
        <button
          className="primary-button"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Bestanden kiezen
        </button>
      </div>

      <div className="upload-summary" aria-live="polite">
        <span>{importedFiles.length} bestand(en) gelezen</span>
        <span>{validForDashboard} bruikbaar voor dashboard</span>
        <span>{demoFileCount} demo-export(s)</span>
        {uploadMessage && <span>{uploadMessage}</span>}
      </div>

      {importedFiles.length === 0 ? (
        <div className="empty-state">
          <h3>Nog geen bestanden</h3>
          <p>
            Upload JSON-exports of laad voorbeelddata om alvast met de
            controle- en dashboardflow te testen.
          </p>
        </div>
      ) : (
        <div className="file-list" aria-label="Geüploade bestanden">
          {importedFiles.map((result) => (
            <FileResultCard key={result.id} result={result} onRemove={handleRemoveFile} />
          ))}
        </div>
      )}
    </section>
  );
}
