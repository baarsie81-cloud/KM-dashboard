export const SUPPORTED_EXPORT_VERSION = '1.0';
export const EXPECTED_APP_NAME = 'Zakelijke KM Logger';

export const requiredRootFields = [
  'appName',
  'exportFormatVersion',
  'exportedAt',
  'user',
  'period',
  'trips',
];

export const requiredTripFields = [
  'date',
  'startAddress',
  'endAddress',
  'finalKm',
  'tripType',
  'mileageRate',
];

export function isSupportedExportFile(data) {
  return (
    data &&
    data.appName === EXPECTED_APP_NAME &&
    data.exportFormatVersion === SUPPORTED_EXPORT_VERSION &&
    Array.isArray(data.trips)
  );
}

export const optionalTripFields = [
  'id',
  'userName',
  'startTime',
  'endTime',
  'startLat',
  'startLng',
  'endLat',
  'endLng',
  'customer',
  'project',
  'odometerStart',
  'odometerEnd',
  'calculatedKm',
  'manualKm',
  'returnTrip',
  'purpose',
  'deductibleAmount',
  'status',
  'createdAt',
  'updatedAt',
  'note',
];
