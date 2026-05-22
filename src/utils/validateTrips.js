import { calculateDeductibleAmount, isBusinessTrip, roundCurrency, toNumber } from './calculations.js';

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function hasPositiveNumber(value) {
  return toNumber(value, 0) > 0;
}

function getExpectedDeductibleAmount(trip) {
  return calculateDeductibleAmount(
    trip.finalKm,
    trip.mileageRate,
    trip.tripType,
  );
}

export function validateTrip(trip, index = 0) {
  const errors = [];
  const warnings = [];
  const criticalErrors = [];
  const tripLabel = `Rit ${index + 1}`;
  const businessTrip = isBusinessTrip(trip.tripType);

  if (!hasValue(trip.id)) {
    criticalErrors.push(`${tripLabel}: id ontbreekt.`);
  }

  if (!hasValue(trip.date)) {
    errors.push(`${tripLabel}: datum ontbreekt.`);
  }

  if (!hasValue(trip.startAddress)) {
    errors.push(`${tripLabel}: startadres ontbreekt.`);
  }

  if (!hasValue(trip.endAddress)) {
    errors.push(`${tripLabel}: eindadres ontbreekt.`);
  }

  if (businessTrip && !hasValue(trip.purpose)) {
    errors.push(`${tripLabel}: doel ontbreekt bij zakelijke rit.`);
  }

  if (businessTrip && !hasValue(trip.customer)) {
    warnings.push(`${tripLabel}: klant ontbreekt bij zakelijke rit.`);
  }

  if (businessTrip && !hasValue(trip.project)) {
    warnings.push(`${tripLabel}: project ontbreekt bij zakelijke rit.`);
  }

  if (businessTrip && !hasPositiveNumber(trip.finalKm)) {
    errors.push(`${tripLabel}: definitieve kilometers ontbreken of zijn 0.`);
  }

  if (!hasValue(trip.mileageRate)) {
    errors.push(`${tripLabel}: kilometertarief ontbreekt.`);
  }

  if (!hasValue(trip.tripType)) {
    criticalErrors.push(`${tripLabel}: type rit ontbreekt.`);
  } else if (!['zakelijk', 'privé', 'prive'].includes(trip.tripType)) {
    warnings.push(`${tripLabel}: type rit "${trip.tripType}" is onbekend.`);
  }

  if (!hasValue(trip.status)) {
    warnings.push(`${tripLabel}: status ontbreekt.`);
  } else if (!['compleet', 'incompleet'].includes(trip.status)) {
    warnings.push(`${tripLabel}: status "${trip.status}" is onbekend.`);
  }

  if (!hasValue(trip.deductibleAmount)) {
    if (hasValue(trip.finalKm) && hasValue(trip.mileageRate)) {
      warnings.push(`${tripLabel}: aftrekbaar bedrag ontbrak en is opnieuw berekend.`);
    } else {
      errors.push(`${tripLabel}: aftrekbaar bedrag ontbreekt en is niet berekenbaar.`);
    }
  } else if (businessTrip && hasValue(trip.finalKm) && hasValue(trip.mileageRate)) {
    const expected = getExpectedDeductibleAmount(trip);
    const actual = roundCurrency(trip.deductibleAmount);

    if (Math.abs(actual - expected) > 0.01) {
      warnings.push(
        `${tripLabel}: aftrekbaar bedrag wijkt af van finalKm x mileageRate.`,
      );
    }
  }

  let validationStatus = 'compleet';
  const allErrors = [...criticalErrors, ...errors];

  if (criticalErrors.length > 0) {
    validationStatus = 'fout';
  } else if (trip.status === 'incompleet' || errors.length > 0) {
    validationStatus = 'incompleet';
  } else if (warnings.length > 0) {
    validationStatus = 'waarschuwing';
  }

  return {
    validationStatus,
    errors: allErrors,
    warnings,
  };
}

export function validateTrips(trips = []) {
  return trips.map((trip, index) => validateTrip(trip, index));
}
