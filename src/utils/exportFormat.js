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
  'id',
  'userName',
  'date',
  'startAddress',
  'endAddress',
  'purpose',
  'finalKm',
  'tripType',
  'mileageRate',
  'deductibleAmount',
  'status',
  'createdAt',
  'updatedAt',
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
  'note',
];
