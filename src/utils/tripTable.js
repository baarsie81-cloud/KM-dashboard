import { getMonth, getQuarter, getYear } from './exportBuilders.js';

export const defaultTripFilters = {
  search: '',
  user: '',
  year: '',
  month: '',
  quarter: '',
  customer: '',
  project: '',
  tripType: '',
  status: '',
  sourceFileName: '',
};

export function matchesTripSearch(trip, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  const haystack = [
    trip.startAddress,
    trip.endAddress,
    trip.customer,
    trip.project,
    trip.purpose,
    trip.userName,
    trip.sourceUserName,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(searchTerm.toLowerCase());
}

export function getTripSortValue(trip, sortBy) {
  switch (sortBy) {
    case 'gebruiker':
      return trip.sourceUserName || trip.userName || '';
    case 'kilometers':
      return trip.finalKm;
    case 'bedrag':
      return trip.deductibleAmount;
    case 'datum':
    default:
      return `${trip.date || ''} ${trip.startTime || ''}`;
  }
}

export function filterTripsForTable(trips, filters = defaultTripFilters) {
  return trips.filter((trip) => {
    return (
      matchesTripSearch(trip, filters.search) &&
      (!filters.user || (trip.sourceUserName || trip.userName) === filters.user) &&
      (!filters.year || getYear(trip.date) === filters.year) &&
      (!filters.month || getMonth(trip.date) === filters.month) &&
      (!filters.quarter || getQuarter(trip.date) === filters.quarter) &&
      (!filters.customer || trip.customer === filters.customer) &&
      (!filters.project || trip.project === filters.project) &&
      (!filters.tripType || trip.tripType === filters.tripType) &&
      (!filters.status || trip.validationStatus === filters.status) &&
      (!filters.sourceFileName || trip.sourceFileName === filters.sourceFileName)
    );
  });
}

export function sortTripsForTable(trips, sortConfig = { by: 'datum', direction: 'desc' }) {
  return [...trips].sort((firstTrip, secondTrip) => {
    const first = getTripSortValue(firstTrip, sortConfig.by);
    const second = getTripSortValue(secondTrip, sortConfig.by);
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    if (typeof first === 'number' && typeof second === 'number') {
      return (first - second) * direction;
    }

    return String(first).localeCompare(String(second), 'nl-NL') * direction;
  });
}
