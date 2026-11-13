import React, { useDeferredValue, useEffect, useMemo } from 'react';
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from '@/config/mapTiles';
import { GeoJSON, MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type {
    MapDistrictResponse,
    MapNeighborhoodResponse,
    DistrictCoordinatorMapResponse,
    NeighborhoodCoordinatorMapResponse,
} from '@/types';
import type { DamagePointResponse } from '@/types/damage';
import type { CriticalFacility } from '@/types/hazard';
import type { LayerState } from './operationMapLayers';
import type { SelectedMapEntity } from './MapEntityDetails';
import {
    createDamageIcon, createDistrictCenterIcon, createNeighborhoodCenterIcon, createResourceIcon,
    createCriticalFacilityIcon,
    polygonCenter, districtStyle, neighborhoodStyle, toFeature,
    buildDistrictTooltip, buildNeighborhoodTooltip,
} from './mapIcons';

// Fix leaflet default icon issue in React (module-level, once)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapBoundsControllerProps { bounds: L.LatLngBounds | null; }
const MapBoundsController: React.FC<MapBoundsControllerProps> = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
        } else {
            map.setView([41.0082, 28.9784], 10);
        }
    }, [bounds, map]);
    return null;
};

interface OperationMapProps {
    layers: LayerState;
    districts?: MapDistrictResponse[];
    neighborhoods?: MapNeighborhoodResponse[];
    damagePoints: DamagePointResponse[];
    districtCenters: DistrictCoordinatorMapResponse[];
    neighborhoodCenters: NeighborhoodCoordinatorMapResponse[];
    criticalFacilities?: CriticalFacility[];
    activeDistrictId: string | null;
    activeNeighborhoodId: string | null;
    activeBounds: L.LatLngBounds | null;
    activeDistrictName?: string;
    onSelectDistrict: (district: MapDistrictResponse) => void;
    onSelectNeighborhood: (nb: MapNeighborhoodResponse) => void;
    onSelectEntity: (entity: SelectedMapEntity) => void;
}

/**
 * Saf harita render component'i — hiç veri çekmez (fetch page'de), yalnızca props'tan gelen
 * veriyi Leaflet layer'larına döker.
 */
export const OperationMap: React.FC<OperationMapProps> = ({
    layers, districts, neighborhoods, damagePoints, districtCenters, neighborhoodCenters,
    criticalFacilities,
    activeDistrictId, activeNeighborhoodId, activeBounds, activeDistrictName,
    onSelectDistrict, onSelectNeighborhood, onSelectEntity,
}) => {
    const districtsWithPolygon = useMemo(
        () => districts?.filter((d) => !!d.polygon) ?? [],
        [districts],
    );

    const deferredDistrictsWithPolygon = useDeferredValue(districtsWithPolygon);
    const deferredNeighborhoods = useDeferredValue(neighborhoods);

    return (
        <MapContainer center={[41.0082, 28.9784]} zoom={10} className="w-full h-full">
            <TileLayer
                attribution={MAP_TILE_ATTRIBUTION}
                url={MAP_TILE_URL}
            />
            <MapBoundsController bounds={activeBounds} />

            {/* ── Risk layer: District polygons ── */}
            {layers.risk && !activeDistrictId && deferredDistrictsWithPolygon.map((district) => (
                <GeoJSON
                    key={district.id + '-' + district.riskColor}
                    data={toFeature(district.polygon)}
                    style={() => districtStyle(district.riskColor)}
                    onEachFeature={(_, layer) => {
                        layer.bindTooltip(buildDistrictTooltip(district), { sticky: true });
                        layer.on('click', () => onSelectDistrict(district));
                    }}
                />
            ))}

            {/* ── Risk layer: Neighborhood polygons (inside selected district) ── */}
            {layers.risk && activeDistrictId && deferredNeighborhoods
                ?.filter((nb) => !!nb.polygon)
                .map((nb) => (
                    <GeoJSON
                        key={nb.id + '-' + nb.riskColor + '-' + (nb.id === activeNeighborhoodId)}
                        data={toFeature(nb.polygon)}
                        style={() => neighborhoodStyle(nb.riskColor, nb.id === activeNeighborhoodId)}
                        onEachFeature={(_, layer) => {
                            layer.bindTooltip(buildNeighborhoodTooltip(nb), { sticky: true });
                            layer.on('click', () => onSelectNeighborhood(nb));
                        }}
                    />
                ))}

            {/* ── Damage points layer (pins) ── */}
            {layers.damage && damagePoints.map((point) => (
                <Marker
                    key={point.id}
                    position={[point.latitude, point.longitude]}
                    icon={createDamageIcon(point.damageLevel)}
                    eventHandlers={{ click: () => onSelectEntity({ kind: 'DAMAGE', data: point }) }}
                />
            ))}

            {/* ── Critical Infrastructure layer (Hastane, İtfaiye, Polis vb.) ── */}
            {layers.criticalInfra && criticalFacilities?.map((facility, idx) => (
                <Marker
                    key={`crit-${idx}-${facility.lat}-${facility.lng}`}
                    position={[facility.lat, facility.lng]}
                    icon={createCriticalFacilityIcon(facility.type)}
                    eventHandlers={{ click: () => onSelectEntity({ kind: 'CRITICAL_FACILITY', data: facility }) }}
                >
                    <Tooltip direction="top" offset={[0, -25]}>
                        <div className="text-xs font-semibold">
                            {facility.name || (facility.type === 'hospital' ? 'Hastane' : facility.type === 'fire_station' ? 'İtfaiye İstasyonu' : 'Kamu Tesisi')}
                        </div>
                    </Tooltip>
                </Marker>
            ))}

            {/* ── Resource requests layer: district centroids (city view) ── */}
            {layers.resources && !activeDistrictId && districtsWithPolygon
                .filter((d) => d.openResourceRequestCount > 0)
                .map((district) => {
                    const center = polygonCenter(district.polygon);
                    if (!center) return null;
                    return (
                        <Marker
                            key={`res-d-${district.id}`}
                            position={center}
                            icon={createResourceIcon(district.openResourceRequestCount)}
                            eventHandlers={{ click: () => onSelectEntity({ kind: 'RESOURCE_DISTRICT', data: district }) }}
                        />
                    );
                })}

            {/* ── Resource requests layer: neighborhood centroids (district view) ── */}
            {layers.resources && activeDistrictId && neighborhoods
                ?.filter((nb) => nb.openResourceRequestCount > 0 && nb.polygon)
                .map((nb) => {
                    const center = polygonCenter(nb.polygon);
                    if (!center) return null;
                    return (
                        <Marker
                            key={`res-nb-${nb.id}`}
                            position={center}
                            icon={createResourceIcon(nb.openResourceRequestCount)}
                            eventHandlers={{
                                click: () => onSelectEntity({ kind: 'RESOURCE_NEIGHBORHOOD', data: nb, districtName: activeDistrictName }),
                            }}
                        />
                    );
                })}

            {/* ── District coordination centers layer (all city view) ── */}
            {layers.districtCenters && districtCenters.map((center) => (
                <Marker
                    key={`dc-${center.districtId}`}
                    position={[center.latitude, center.longitude]}
                    icon={createDistrictCenterIcon()}
                    eventHandlers={{ click: () => onSelectEntity({ kind: 'DISTRICT_CENTER', data: center }) }}
                />
            ))}

            {/* ── Neighborhood coordination centers layer (district detail view only) ── */}
            {layers.neighborhoodCenters && activeDistrictId && neighborhoodCenters.map((center) => (
                <Marker
                    key={`nc-${center.neighborhoodId}`}
                    position={[center.latitude, center.longitude]}
                    icon={createNeighborhoodCenterIcon()}
                    eventHandlers={{ click: () => onSelectEntity({ kind: 'NEIGHBORHOOD_CENTER', data: center }) }}
                />
            ))}
        </MapContainer>
    );
};
