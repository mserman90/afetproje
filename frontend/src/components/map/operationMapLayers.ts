import type { Role } from '@/types';

export interface LayerState {
    risk: boolean;
    damage: boolean;
    resources: boolean;
    districtCenters: boolean;
    neighborhoodCenters: boolean;
    criticalInfra: boolean;
}

export type LayerKey = keyof LayerState;

export interface LayerMeta {
    key: LayerKey;
    label: string;
    color: string;
}

export const LAYER_ITEMS: LayerMeta[] = [
    { key: 'risk',                label: 'Risk',                                color: 'bg-green-500' },
    { key: 'damage',              label: 'Hasar Tespiti',                       color: 'bg-orange-500' },
    { key: 'criticalInfra',       label: 'Kritik Altyapı (Hastane & İtfaiye)',  color: 'bg-rose-500' },
    { key: 'resources',           label: 'Kaynak Talepleri',                    color: 'bg-blue-500' },
    { key: 'districtCenters',     label: 'İlçe Merkezleri',                     color: 'bg-indigo-600' },
    { key: 'neighborhoodCenters', label: 'Mahalle Merkezleri',                 color: 'bg-violet-600' },
];

/**
 * Role'e göre haritanın açılış layer kombinasyonu.
 */
export function getDefaultLayersForRole(role: Role | undefined): LayerState {
    const base: LayerState = {
        risk: true,
        damage: true,
        criticalInfra: true,
        resources: false,
        districtCenters: false,
        neighborhoodCenters: false,
    };

    switch (role) {
        case 'DISTRICT_COORDINATOR':
            return { ...base, resources: true, districtCenters: true };
        case 'NEIGHBORHOOD_COORDINATOR':
            return { ...base, neighborhoodCenters: true };
        case 'VOLUNTEER':
        case 'ADMIN':
        default:
            return base;
    }
}
