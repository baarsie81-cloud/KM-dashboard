export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

export function roundCurrency(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

export function calculateDeductibleAmount(finalKm, mileageRate, tripType = 'zakelijk') {
  if (tripType !== 'zakelijk') {
    return 0;
  }

  return roundCurrency(toNumber(finalKm) * toNumber(mileageRate));
}

export function isBusinessTrip(tripType) {
  return tripType === 'zakelijk';
}
