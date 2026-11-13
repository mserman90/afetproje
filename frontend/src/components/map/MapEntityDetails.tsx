import React from 'react';
import { X, Navigation, PackageOpen, Building2, Flame, Shield, School, AlertCircle, HeartPulse } from 'lucide-react';
import type {
    DistrictCoordinatorMapResponse,
    NeighborhoodCoordinatorMapResponse,
    MapDistrictResponse,
    MapNeighborhoodResponse,
} from '@/types';
import type { DamagePointResponse } from '@/types/damage';
import type { CriticalFacility } from '@/types/hazard';
import { googleMapsUrl } from './mapIcons';

export type SelectedMapEntity =
    | { kind: 'DAMAGE'; data: DamagePointResponse }
    | { kind: 'RESOURCE_DISTRICT'; data: MapDistrictResponse }
    | { kind: 'RESOURCE_NEIGHBORHOOD'; data: MapNeighborhoodResponse; districtName?: string }
    | { kind: 'DISTRICT_CENTER'; data: DistrictCoordinatorMapResponse }
    | { kind: 'NEIGHBORHOOD_CENTER'; data: NeighborhoodCoordinatorMapResponse }
    | { kind: 'CRITICAL_FACILITY'; data: CriticalFacility };

interface MapEntityDetailsProps {
    entity: SelectedMapEntity | null;
    onClose: () => void;
}

const StatTile: React.FC<{ value: number; label: string; bg: string; fg: string }> = ({ value, label, bg, fg }) => (
    <div className="text-center rounded-md px-1 py-1.5" style={{ background: bg }}>
        <div className="text-base font-bold" style={{ color: fg }}>{value}</div>
        <div className="text-[10px] text-gray-500">{label}</div>
    </div>
);

const CenterDetails: React.FC<{
    title: string; subtitle?: string; address?: string;
    openEventCount: number; openResourceRequestCount: number; totalDamageCount: number;
    lat: number; lng: number; centerUpdatedAt?: string; accentColor: string;
}> = ({ title, subtitle, address, openEventCount, openResourceRequestCount, totalDamageCount, lat, lng, centerUpdatedAt, accentColor }) => (
    <div>
        <p className="text-sm font-bold" style={{ color: accentColor }}>{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        {address && <p className="text-xs text-gray-600 italic mt-1">{address}</p>}
        <div className="grid grid-cols-3 gap-1.5 mt-3 mb-3">
            <StatTile value={openEventCount} label="Ekip İhtiyacı" bg="#eff6ff" fg="#1d4ed8" />
            <StatTile value={openResourceRequestCount} label="Kaynak Talebi" bg="#fef3c7" fg="#92400e" />
            <StatTile value={totalDamageCount} label="Hasar Tespiti" bg="#fee2e2" fg="#b91c1c" />
        </div>
        <a
            href={googleMapsUrl(lat, lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 rounded-md px-2.5 py-1.5 w-fit hover:bg-blue-100"
        >
            <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
            Google Harita'da Yol Tarifi
        </a>
        {centerUpdatedAt && (
            <p className="text-[11px] text-gray-400 mt-2">
                Son güncelleme: {new Date(centerUpdatedAt).toLocaleDateString('tr-TR')}
            </p>
        )}
    </div>
);

const CriticalFacilityDetails: React.FC<{ facility: CriticalFacility }> = ({ facility }) => {
    const typeLabelMap: Record<CriticalFacility['type'], { title: string; color: string; icon: React.ReactNode }> = {
        hospital: { title: 'Hastane / Sağlık Tesisi', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: <HeartPulse className="w-4 h-4 text-rose-600" /> },
        fire_station: { title: 'İtfaiye İstasyonu', color: 'text-orange-700 bg-orange-50 border-orange-200', icon: <Flame className="w-4 h-4 text-orange-600" /> },
        police: { title: 'Emniyet / Polis Merkezi', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: <Shield className="w-4 h-4 text-blue-600" /> },
        school: { title: 'Eğitim & Tahliye Alanı', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', icon: <School className="w-4 h-4 text-indigo-600" /> },
        emergency: { title: 'Acil Müdahale Noktası', color: 'text-red-700 bg-red-50 border-red-200', icon: <AlertCircle className="w-4 h-4 text-red-600" /> },
    };

    const info = typeLabelMap[facility.type] || typeLabelMap.emergency;

    return (
        <div className="space-y-3">
            <div className="flex items-start gap-2">
                <span className="p-1.5 rounded-md bg-gray-100">{info.icon}</span>
                <div>
                    <span className="text-[11px] font-semibold tracking-wide uppercase text-gray-500 block">
                        Kritik Kamu Altyapısı
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">
                        {facility.name || info.title}
                    </h4>
                </div>
            </div>

            <div className={`text-xs px-2.5 py-1.5 rounded border font-medium ${info.color}`}>
                Tür: {info.title}
            </div>

            <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2.5 rounded border border-gray-100">
                <div className="flex justify-between">
                    <span>Koordinatlar:</span>
                    <span className="font-mono text-gray-800">{facility.lat.toFixed(4)}, {facility.lng.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Kaynak:</span>
                    <span className="text-gray-700 font-medium">OpenStreetMap (OSM) Canlı</span>
                </div>
            </div>

            <a
                href={googleMapsUrl(facility.lat, facility.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 rounded-md px-2.5 py-1.5 w-fit hover:bg-blue-100 font-medium"
            >
                <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                Google Harita'da Yol Tarifi
            </a>
        </div>
    );
};

function renderEntityContent(entity: SelectedMapEntity) {
    switch (entity.kind) {
        case 'DAMAGE':
            return (
                <div>
                    <p className="text-sm font-bold text-gray-900">{entity.data.address || 'Hasarlı Bina'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{entity.data.districtName} / {entity.data.neighborhoodName}</p>
                    <div className="mt-2 text-xs">
                        <span className="font-medium text-gray-700">Hasar Seviyesi: </span>
                        <span className="font-bold text-orange-600">{entity.data.damageLevel}</span>
                    </div>
                    {entity.data.note && (
                        <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">{entity.data.note}</p>
                    )}
                    <a
                        href={googleMapsUrl(entity.data.latitude, entity.data.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 rounded-md px-2.5 py-1.5 w-fit hover:bg-blue-100 mt-3"
                    >
                        <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                        Google Harita'da Yol Tarifi
                    </a>
                </div>
            );
        case 'RESOURCE_DISTRICT':
            return (
                <div>
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                        <PackageOpen className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Kaynak Talebi Özeti</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{entity.data.name} İlçesi</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Bu ilçede toplam <strong>{entity.data.openResourceRequestCount}</strong> adet açık kaynak talebi bulunmaktadır.
                    </p>
                </div>
            );
        case 'RESOURCE_NEIGHBORHOOD':
            return (
                <div>
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                        <PackageOpen className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Kaynak Talebi Özeti</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{entity.data.name} Mahallesi</p>
                    {entity.districtName && (
                        <p className="text-xs text-gray-500">{entity.districtName} İlçesi</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        Bu mahallede toplam <strong>{entity.data.openResourceRequestCount}</strong> adet açık kaynak talebi bulunmaktadır.
                    </p>
                </div>
            );
        case 'DISTRICT_CENTER':
            return (
                <CenterDetails
                    title={`${entity.data.districtName} Koordinasyon Merkezi`}
                    subtitle="İlçe Koordinasyon Merkezi"
                    address={entity.data.address}
                    openEventCount={entity.data.openEventCount}
                    openResourceRequestCount={entity.data.openResourceRequestCount}
                    totalDamageCount={entity.data.totalDamageCount}
                    lat={entity.data.latitude}
                    lng={entity.data.longitude}
                    centerUpdatedAt={entity.data.centerUpdatedAt}
                    accentColor="#1d4ed8"
                />
            );
        case 'NEIGHBORHOOD_CENTER':
            return (
                <CenterDetails
                    title={`${entity.data.neighborhoodName} Koordinasyon Merkezi`}
                    subtitle={entity.data.districtName ? `${entity.data.districtName} İlçesi` : undefined}
                    address={entity.data.address}
                    openEventCount={entity.data.openEventCount}
                    openResourceRequestCount={entity.data.openResourceRequestCount}
                    totalDamageCount={entity.data.totalDamageCount}
                    lat={entity.data.latitude}
                    lng={entity.data.longitude}
                    centerUpdatedAt={entity.data.centerUpdatedAt}
                    accentColor="#7c3aed"
                />
            );
        case 'CRITICAL_FACILITY':
            return <CriticalFacilityDetails facility={entity.data} />;
        default:
            return null;
    }
}

export const MapEntityDetails: React.FC<MapEntityDetailsProps> = ({ entity, onClose }) => {
    if (!entity) return null;

    return (
        <div
            className="absolute z-[1000] left-1/2 -translate-x-1/2 bottom-3 w-[calc(100%-24px)] max-w-sm
                       sm:left-3 sm:translate-x-0 sm:bottom-3 sm:w-[320px] sm:max-w-none"
        >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-h-[50vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    aria-label="Detayı kapat"
                    className="float-right text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
                >
                    <X className="h-4 w-4" />
                </button>
                {renderEntityContent(entity)}
            </div>
        </div>
    );
};
