import { calculateDeductibleAmount, isBusinessTrip, roundCurrency, toNumber } from './calculations.js';

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function hasPositiveNumber(value) {
  return toNumber(value, 0) > 0;
}

const requiredCompleteTripFields = [
  { key: 'date', label: 'datum', hasValue },
  { key: 'tripType', label: 'type rit', hasValue },
  { key: 'finalKm', label: 'kilometers', hasValue: hasPositiveNumber },
  { key: 'mileageRate', label: 'tarief', hasValue },
  { key: 'startAddress', label: 'startadres', hasValue },
  { key: 'endAddress', label: 'eindadres', hasValue },
];

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
  const missingCompleteFields = requiredCompleteTripFields.filter((field) => {
    return !field.hasValue(trip[field.key]);
  });

  if (!hasValue(trip.id)) {
    warnings.push(`${tripLabel}: id ontbreekt.`);
  }

  if (businessTrip && !hasValue(trip.customer)) {
    warnings.push(`${tripLabel}: klant ontbreekt bij zakelijke rit.`);
  }

  if (businessTrip && !hasValue(trip.project)) {
    warnings.push(`${tripLabel}: project ontbreekt bij zakelijke rit.`);
  }

  if (businessTrip && !hasValue(trip.purpose)) {
    warnings.push(`${tripLabel}: doel ontbreekt bij zakelijke rit.`);
  }

  if (hasValue(trip.tripType) && !['zakelijk', 'privé', 'prive'].includes(trip.tripType)) {
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
      warnings.push(`${tripLabel}: aftrekbaar bedrag ontbreekt en is niet berekenbaar.`);
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

  if (missingCompleteFields.length > 0) {
    const labels = missingCompleteFields.map((field) => field.label).join(', ');
    errors.push(`${tripLabel}: incompleet, mist minimaal: ${labels}.`);
  }

  let validationStatus = 'compleet';
  const allErrors = [...criticalErrors, ...errors];

  if (criticalErrors.length > 0) {
    validationStatus = 'fout';
  } else if (errors.length > 0) {
    validationStatus = 'incompleet';
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
