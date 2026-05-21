// src/lib/locationEstimates.js
// Coarse regional soil + EC estimates for Morocco
// Based on well-known agricultural zones — no API, no DB, no cost
// Replace EC sensor reading with this estimate if no EC sensor is present

const MOROCCO_ZONES = [
  // [latMin, latMax, lngMin, lngMax, label, ec_est, notes]
  { latMin:33.5, latMax:34.5, lngMin:-7.5,  lngMax:-5.5,  label:'Chaouia Plain',   ec:1.4, notes:'Fertile plains, moderate salinity, good for cereals and vegetables' },
  { latMin:34.0, latMax:34.5, lngMin:-6.9,  lngMax:-6.5,  label:'Rabat Coast',     ec:1.6, notes:'Sandy-loam, coastal influence, mild salinity' },
  { latMin:33.5, latMax:34.0, lngMin:-8.5,  lngMax:-7.5,  label:'Casablanca Belt', ec:1.8, notes:'Urban-adjacent, variable soil quality' },
  { latMin:31.5, latMax:32.5, lngMin:-9.0,  lngMax:-7.5,  label:'Doukkala Plain',  ec:1.9, notes:'High agricultural intensity, some saline patches' },
  { latMin:32.0, latMax:33.5, lngMin:-6.5,  lngMax:-4.5,  label:'Middle Atlas Valleys', ec:1.2, notes:'Mountain runoff soils, lower salinity, good fertility' },
  { latMin:30.0, latMax:32.0, lngMin:-9.5,  lngMax:-7.0,  label:'Souss Valley',    ec:2.3, notes:'Intensive horticulture, watch for salinity buildup' },
  { latMin:35.0, latMax:35.9, lngMin:-6.0,  lngMax:-4.5,  label:'Rif Coast',       ec:1.3, notes:'Mediterranean climate, good for citrus and olive' },
  { latMin:30.0, latMax:31.5, lngMin:-10.0, lngMax:-8.0,  label:'Anti-Atlas',      ec:0.9, notes:'Dry mountainous, low organic matter' },
  // Default fallback for any Moroccan coordinate not matched
];

/**
 * Get estimated EC and zone notes for a given lat/lng in Morocco.
 * Returns ec (dS/m) and a short description.
 */
export function getLocationEstimate(lat, lng) {
  const zone = MOROCCO_ZONES.find(z =>
    lat >= z.latMin && lat <= z.latMax &&
    lng >= z.lngMin && lng <= z.lngMax
  )

  if (zone) {
    return {
      ec:     zone.ec,
      zone:   zone.label,
      notes:  zone.notes,
      source: 'local-estimate'
    }
  }

  // Outside known zones — return a neutral estimate
  return {
    ec:     1.5,
    zone:   'Unknown zone',
    notes:  'No regional data for this location — using average estimate',
    source: 'default-estimate'
  }
}