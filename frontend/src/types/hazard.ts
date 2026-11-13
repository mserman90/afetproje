export type DisasterType =
    | 'seismic'
    | 'flood'
    | 'wildfire'
    | 'conflict'
    | 'airpollution'
    | 'drought'
    | 'storm'
    | 'aviation';

export interface SimulationParams {
    intensity: number;      // 0 - 100
    exposure: number;       // 0 - 100
    vulnerability: number;  // 0 - 100
    resilience: number;     // 0 - 100
    cascade: number;        // 0 - 100
}

export interface SimulationResults {
    normalizeRisk: number;       // 0.0 - 1.0
    mdr: number;                 // Mean Damage Ratio 0.0 - 1.0
    pml: number;                 // Probable Maximum Loss in Million $
    aal: number;                 // Average Annual Loss in Million $
    infraCollapse: number;       // Infrastructure Collapse Probability %
    cascadeScenario: string;     // Multi-hazard chain reaction scenario
}

export interface WeatherData {
    temp: number;
    windSpeed: number;
    precipitation: number;
    humidity: number;
    conditionCode: number;
}

export interface WeatherAlert {
    event: string;
    headline: string;
    description: string;
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
    onset: string;
    expires: string;
}

export interface CriticalFacility {
    lat: number;
    lng: number;
    type: 'hospital' | 'school' | 'police' | 'fire_station' | 'emergency';
    name?: string;
}

export interface InfraData {
    buildingCount: number;
    hospitalCount: number;
    schoolCount: number;
    emergencyCount: number;
    densityScore: number;
    facilities: CriticalFacility[];
    buildingPoints: Array<{ lat: number; lng: number }>;
}

export interface TargetZone {
    lat: number;
    lng: number;
    name: string;
    districtId?: string;
    weather?: WeatherData;
    infra?: InfraData;
    alerts?: WeatherAlert[];
}
