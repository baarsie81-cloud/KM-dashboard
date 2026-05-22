import {
  EXPECTED_APP_NAME,
  SUPPORTED_EXPORT_VERSION,
  requiredRootFields,
  requiredTripFields,
} from './exportFormat.js';

function hasField(object, field) {
  return Object.prototype.hasOwnProperty.call(object, field);
}

function createId(fileName, data) {
  const exportedAt = data?.exportedAt ?? 'geen-exportdatum';
  const userName = data?.user?.name ?? 'onbekende-gebruiker';

  return `${fileName}-${userName}-${exportedAt}`;
}

export function validateExportFile(data, fileName = 'onbekend-bestand.json') {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      id: `${fileName}-ongeldig-object`,
      fileName,
      data: null,
      status: 'ongeldig',
      errors: ['De hoofdstructuur moet een JSON-object zijn.'],
      warnings: [],
    };
  }

  requiredRootFields.forEach((field) => {
    if (!hasField(data, field)) {
      errors.push(`Verplicht hoofdveld ontbreekt: ${field}.`);
    }
  });

  if (data.appName !== EXPECTED_APP_NAME) {
    errors.push(`appName moet "${EXPECTED_APP_NAME}" zijn.`);
  }

  if (!data.exportFormatVersion) {
    errors.push('exportFormatVersion ontbreekt.');
  } else if (data.exportFormatVersion !== SUPPORTED_EXPORT_VERSION) {
    warnings.push(
      `exportFormatVersion ${data.exportFormatVersion} is niet expliciet ondersteund; controleer dit bestand extra goed.`,
    );
  }

  if (!data.user || typeof data.user !== 'object' || Array.isArray(data.user)) {
    errors.push('user-object ontbreekt of is ongeldig.');
  } else {
    if (!data.user.name) {
      warnings.push('Gebruikersnaam ontbreekt in user.name.');
    }

    if (!data.user.vehicle) {
      warnings.push('Voertuig ontbreekt in user.vehicle.');
    }
  }

  if (!data.period || typeof data.period !== 'object' || Array.isArray(data.period)) {
    errors.push('period-object ontbreekt of is ongeldig.');
  }

  if (!Array.isArray(data.trips)) {
    errors.push('trips moet een array zijn.');
  } else {
    data.trips.forEach((trip, index) => {
      if (!trip || typeof trip !== 'object' || Array.isArray(trip)) {
        warnings.push(`Rit ${index + 1} is geen geldig object.`);
        return;
      }

      requiredTripFields.forEach((field) => {
        if (!hasField(trip, field)) {
          warnings.push(`Rit ${index + 1}: verplicht veld ontbreekt: ${field}.`);
        }
      });

      if (trip.status && !['compleet', 'incompleet'].includes(trip.status)) {
        warnings.push(`Rit ${index + 1}: status "${trip.status}" is onbekend.`);
      }

      if (trip.tripType && !['zakelijk', 'privé', 'prive'].includes(trip.tripType)) {
        warnings.push(`Rit ${index + 1}: type rit "${trip.tripType}" is onbekend.`);
      }
    });
  }

  const status = errors.length > 0 ? 'ongeldig' : warnings.length > 0 ? 'waarschuwing' : 'geldig';

  return {
    id: createId(fileName, data),
    fileName,
    data,
    status,
    errors,
    warnings,
  };
}
