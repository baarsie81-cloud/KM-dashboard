import { toNumber } from './calculations.js';

const duplicateFields = [
  { key: 'sourceUserName', label: 'gebruiker' },
  { key: 'date', label: 'datum' },
  { key: 'startAddress', label: 'startadres' },
  { key: 'endAddress', label: 'eindadres' },
  { key: 'finalKm', label: 'kilometers' },
  { key: 'customer', label: 'klant' },
  { key: 'project', label: 'project' },
  { key: 'purpose', label: 'doel' },
];

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function valuesMatch(field, firstTrip, secondTrip) {
  if (field.key === 'finalKm') {
    return toNumber(firstTrip.finalKm, -1) === toNumber(secondTrip.finalKm, -2);
  }

  const firstValue = normalizeText(firstTrip[field.key]);
  const secondValue = normalizeText(secondTrip[field.key]);

  return firstValue !== '' && firstValue === secondValue;
}

function compareTrips(firstTrip, secondTrip) {
  const matchedFields = duplicateFields.filter((field) =>
    valuesMatch(field, firstTrip, secondTrip),
  );

  const strongRouteMatch =
    matchedFields.some((field) => field.key === 'sourceUserName') &&
    matchedFields.some((field) => field.key === 'date') &&
    matchedFields.some((field) => field.key === 'startAddress') &&
    matchedFields.some((field) => field.key === 'endAddress') &&
    matchedFields.some((field) => field.key === 'finalKm');
  const enoughContext = matchedFields.length >= 6;

  if (!strongRouteMatch && !enoughContext) {
    return null;
  }

  return {
    matchedFields,
    reason: matchedFields.map((field) => field.label).join(', '),
  };
}

function createGroupKey(firstIndex, secondIndex) {
  return `duplicate-${firstIndex}-${secondIndex}`;
}

export function detectDuplicates(trips = []) {
  const duplicateGroups = [];

  for (let firstIndex = 0; firstIndex < trips.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < trips.length; secondIndex += 1) {
      const match = compareTrips(trips[firstIndex], trips[secondIndex]);

      if (!match) {
        continue;
      }

      duplicateGroups.push({
        id: createGroupKey(firstIndex, secondIndex),
        reason: `Overeenkomst op ${match.reason}.`,
        matchedFields: match.matchedFields.map((field) => field.key),
        matchedFieldLabels: match.matchedFields.map((field) => field.label),
        trips: [
          { ...trips[firstIndex], duplicateIndex: firstIndex },
          { ...trips[secondIndex], duplicateIndex: secondIndex },
        ],
      });
    }
  }

  const duplicateTripIndexes = new Set(
    duplicateGroups.flatMap((group) => group.trips.map((trip) => trip.duplicateIndex)),
  );

  return {
    duplicateGroups,
    duplicateTripCount: duplicateTripIndexes.size,
  };
}
