/**
 * Vital sign types with their unit and the range of values that makes sense
 * for a measurement. The range only checks the format of the data (US14);
 * it is not a clinical rule and it does not create alerts.
 * @readonly
 */
export const VitalSignType = Object.freeze({
    HEART_RATE: 'HeartRate',
    BLOOD_PRESSURE: 'BloodPressure',
    OXYGEN_SATURATION: 'OxygenSaturation',
    TEMPERATURE: 'Temperature',
    GLUCOSE: 'Glucose'
});

/** Unit and accepted range for each type. */
export const VitalSignRules = Object.freeze({
    HeartRate: {unit: 'bpm', min: 20, max: 250},
    BloodPressure: {unit: 'mmHg', min: 50, max: 260, secondaryMin: 30, secondaryMax: 160},
    OxygenSaturation: {unit: '%', min: 50, max: 100},
    Temperature: {unit: '°C', min: 30, max: 45},
    Glucose: {unit: 'mg/dL', min: 20, max: 600}
});
