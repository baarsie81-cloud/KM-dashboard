import { calculateDeductibleAmount, roundCurrency, toNumber } from './calculations.js';
import { validateTrip } from './validateTrips.js';

function normalizeTripType(value) {
  if (value === 'prive') {
    return 'privé';
  }

  return value || '';
}

function normalizeDeductibleAmount(trip) {
  const tripType = normalizeTripType(trip.tripType);

  if (tripType !== 'zakelijk') {
    return 0;
  }

  if (trip.deductibleAmount !== null && trip.deductibleAmount !== undefined && trip.deductibleAmount !== '') {
    return roundCurrency(trip.deductibleAmount);
  }

  return calculateDeductibleAmount(
    trip.finalKm,
    trip.mileageRate,
    tripType,
  );
}

export function normalizeTrip(trip, sourceFile, index) {
  const user = sourceFile.data?.user ?? {};
  const period = sourceFile.data?.period ?? {};
  const tripType = normalizeTripType(trip.tripType);
  const normalizedTrip = {
    ...trip,
    id: trip.id || '',
    userName: trip.userName || user.name || '',
    tripType,
    finalKm: toNumber(trip.finalKm, 0),
    mileageRate: toNumber(trip.mileageRate, user.defaultMileageRate ?? 0),
    deductibleAmount: normalizeDeductibleAmount({ ...trip, tripType }),
    sourceFileName: sourceFile.fileName,
    sourceUserName: user.name || '',
    sourceVehicle: user.vehicle || '',
    sourceLicensePlate: user.licensePlate || '',
    sourcePeriodFrom: period.from || '',
    sourcePeriodTo: period.to || '',
    sourceExportedAt: sourceFile.data?.exportedAt || '',
  };
  const validation = validateTrip(normalizedTrip, index);

  return {
    ...normalizedTrip,
    validationStatus: validation.validationStatus,
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
    countsForDeduction:
      normalizedTrip.tripType === 'zakelijk' &&
      !['incompleet', 'fout'].includes(validation.validationStatus) &&
      normalizedTrip.finalKm > 0,
  };
}

export function normalizeTrips(importedFiles = []) {
  return importedFiles.flatMap((file) => {
    if (file.status === 'ongeldig' || !Array.isArray(file.data?.trips)) {
      return [];
    }

    return file.data.trips.map((trip, index) => normalizeTrip(trip, file, index));
  });
}
