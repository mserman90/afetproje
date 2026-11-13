import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { queryKeys } from '@/utils/queryKeys';
import { getMapDistricts, getMapNeighborhoods } from '@/api/map.api';
import { LoadingSpinner } from '@/components/ui';
import { Building2, Network } from 'lucide-react';
import { DistrictSection } from '@/components/coordination/DistrictSection';
import { NeighborhoodSection } from '@/components/coordination/NeighborhoodSection';
import { turkishCompare } from '@/utils/turkishSort';
import { IntelligenceGraph } from '@/components/intelligence/IntelligenceGraph';
import { scrapeLiveOpenIntelligence } from '@/services/openIntelligenceService';

// ── Main page ─────────────────────────────────────────────────────────────────
export const CoordinationCenterPage: React.FC = () => {
    const { user } = useAuthStore();
    const role = user?.role;
    const [searchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState<'district' | 'neighborhood' | 'intelligence'>('district');
    const [adminDistrictId, setAdminDistrictId] = useState<string>('');
    const [adminNeighborhoodDistrictId, setAdminNeighborhoodDistrictId] = useState<string>('');
    const [adminNeighborhoodId, setAdminNeighborhoodId] = useState<string>('');

    // DC-specific tab state
    const [dcTab, setDcTab] = useState<'district' | 'neighborhood' | 'intelligence'>('district');
    const [dcNeighborhoodId, setDcNeighborhoodId] = useState<string>('');

    // URL'den tab parametresi gelirse ilgili sekmeyi aç
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'intelligence') {
            setActiveTab('intelligence');
            setDcTab('intelligence');
        }
    }, [searchParams]);

    // Fetch district list
    const { data: allDistricts = [], isLoading: loadingDistricts } = useQuery({
        queryKey: queryKeys.map.districts(),
        queryFn: getMapDistricts,
    });

    // Fetch neighborhoods for admin neighborhood tab
    const { data: adminNeighborhoods = [], isLoading: loadingAdminNeighborhoods } = useQuery({
        queryKey: queryKeys.map.neighborhoods(adminNeighborhoodDistrictId),
        queryFn: () => getMapNeighborhoods(adminNeighborhoodDistrictId),
        enabled: !!adminNeighborhoodDistrictId,
    });

    // Canlı Açık Kaynak İstihbarat Verisi (USGS, Open-Meteo, NOAA, GDACS - Keyless)
    const { 
        data: intelligenceEvents = [], 
        refetch: refetchIntel, 
        isFetching: fetchingIntel 
    } = useQuery({
        queryKey: ['openIntelligenceEvents'],
        queryFn: scrapeLiveOpenIntelligence,
        staleTime: 1000 * 60 * 10,
    });

    const dcDistrictId = user?.districtId ?? '';
    const ncNeighborhoodId = user?.neighborhoodId ?? '';
    const ncDistrictId = user?.districtId ?? '';

    const { data: ncNeighborhoods = [] } = useQuery({
        queryKey: queryKeys.map.neighborhoods(ncDistrictId),
        queryFn: () => getMapNeighborhoods(ncDistrictId),
        enabled: role === 'NEIGHBORHOOD_COORDINATOR' && !!ncDistrictId,
    });

    const { data: dcNeighborhoods = [], isLoading: loadingDcNeighborhoods } = useQuery({
        queryKey: queryKeys.map.neighborhoods(dcDistrictId),
        queryFn: () => getMapNeighborhoods(dcDistrictId),
        enabled: role === 'DISTRICT_COORDINATOR' && !!dcDistrictId,
    });

    const dcDistrict = allDistricts.find(d => d.id === dcDistrictId);
    const ncNeighborhood = ncNeighborhoods.find(n => n.id === ncNeighborhoodId);
    const ncDistrictObj = allDistricts.find(d => d.id === ncDistrictId);
    const adminSelectedDistrict = allDistricts.find(d => d.id === adminDistrictId);
    const adminSelectedNeighborhoodDistrict = allDistricts.find(d => d.id === adminNeighborhoodDistrictId);
    const adminSelectedNeighborhood = adminNeighborhoods.find(n => n.id === adminNeighborhoodId);

    // ── DISTRICT COORDINATOR VIEW ─────────────────────────────────────────────
    if (role === 'DISTRICT_COORDINATOR') {
        const dcSelectedNeighborhood = dcNeighborhoods.find(n => n.id === dcNeighborhoodId);

        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Building2 className="h-6 w-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Koordinatörlük & Operasyon Merkezi</h1>
                    </div>
                    <p className="text-sm text-gray-500">
                        {dcDistrict?.name ? `${dcDistrict.name} İlçesi` : 'İlçeniz'} — Operasyon merkezleri ve canlı tehdit grafı
                    </p>
                </div>

                {loadingDistricts ? (
                    <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                ) : !dcDistrictId ? (
                    <div className="text-center py-12 text-gray-500">
                        Hesabınıza henüz bir ilçe atanmamış. Lütfen yöneticinizle iletişime geçin.
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2 bg-gray-100 rounded-lg p-1 w-fit">
                            <button
                                onClick={() => setDcTab('district')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    dcTab === 'district'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                İlçe Merkezim
                            </button>
                            <button
                                onClick={() => setDcTab('neighborhood')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    dcTab === 'neighborhood'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Mahalle Merkezleri
                            </button>
                            <button
                                onClick={() => setDcTab('intelligence')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                    dcTab === 'intelligence'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Network className="w-4 h-4" />
                                <span>Canlı Tehdit Bilgi Grafı (Gözcü)</span>
                            </button>
                        </div>

                        {dcTab === 'district' && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
                                <DistrictSection districtId={dcDistrictId} district={dcDistrict} />
                            </div>
                        )}

                        {dcTab === 'neighborhood' && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle Seç</label>
                                    <select
                                        value={dcNeighborhoodId}
                                        onChange={e => setDcNeighborhoodId(e.target.value)}
                                        disabled={loadingDcNeighborhoods}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        <option value="">
                                            {loadingDcNeighborhoods ? 'Yükleniyor...' : '-- Mahalle seçiniz --'}
                                        </option>
                                        {[...dcNeighborhoods]
                                            .sort((a, b) => turkishCompare(a.name, b.name))
                                            .map(n => (
                                                <option key={n.id} value={n.id}>{n.name}</option>
                                            ))}
                                    </select>
                                </div>

                                {dcNeighborhoodId ? (
                                    <NeighborhoodSection
                                        key={dcNeighborhoodId}
                                        neighborhoodId={dcNeighborhoodId}
                                        neighborhood={dcSelectedNeighborhood}
                                        districtName={dcDistrict?.name}
                                    />
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-8">
                                        Yönetmek istediğiniz mahalleyi seçin.
                                    </p>
                                )}
                            </div>
                        )}

                        {dcTab === 'intelligence' && (
                            <IntelligenceGraph
                                events={intelligenceEvents}
                                onRefresh={() => refetchIntel()}
                                isRefreshing={fetchingIntel}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }

    // ── NEIGHBORHOOD COORDINATOR VIEW ─────────────────────────────────────────
    if (role === 'NEIGHBORHOOD_COORDINATOR') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Building2 className="h-6 w-6 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Mahalle Koordinasyon Merkezi</h1>
                    </div>
                    <p className="text-sm text-gray-500">
                        {ncNeighborhood?.name ? `${ncNeighborhood.name} Mahallesi` : 'Mahalleniz'} ({ncDistrictObj?.name ? `${ncDistrictObj.name} İlçesi` : ''})
                    </p>
                </div>

                {loadingDistricts ? (
                    <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                ) : !ncNeighborhoodId ? (
                    <div className="text-center py-12 text-gray-500">
                        Hesabınıza henüz bir mahalle atanmamış. Lütfen yöneticinizle iletişime geçin.
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
                            <NeighborhoodSection
                                key={ncNeighborhoodId}
                                neighborhoodId={ncNeighborhoodId}
                                neighborhood={ncNeighborhood}
                                districtName={ncDistrictObj?.name}
                            />
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Network className="w-5 h-5 text-indigo-600" />
                                <span>Bölgesel Tehdit & Bilgi Grafı</span>
                            </h3>
                            <IntelligenceGraph
                                events={intelligenceEvents}
                                onRefresh={() => refetchIntel()}
                                isRefreshing={fetchingIntel}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── ADMIN VIEW ────────────────────────────────────────────────────────────
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Koordinatörlük & Operasyon Merkezi</h1>
                </div>
                <p className="text-sm text-gray-500">
                    İlçe ve mahalle operasyon merkezi konumlarını yönetin ve canlı bölgesel tehdit ağını izleyin.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                    onClick={() => setActiveTab('district')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'district'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    İlçe Merkezleri
                </button>
                <button
                    onClick={() => setActiveTab('neighborhood')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'neighborhood'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Mahalle Merkezleri
                </button>
                <button
                    onClick={() => setActiveTab('intelligence')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        activeTab === 'intelligence'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Network className="w-4 h-4" />
                    <span>Canlı Tehdit Bilgi Grafı (Gözcü)</span>
                </button>
            </div>

            {/* District tab */}
            {activeTab === 'district' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            İlçe Seç
                        </label>
                        <select
                            value={adminDistrictId}
                            onChange={e => setAdminDistrictId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- İlçe seçiniz --</option>
                            {[...allDistricts]
                                .sort((a, b) => turkishCompare(a.name, b.name))
                                .map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {adminDistrictId && (
                        <DistrictSection
                            key={adminDistrictId}
                            districtId={adminDistrictId}
                            district={adminSelectedDistrict}
                        />
                    )}
                    {!adminDistrictId && (
                        <p className="text-sm text-gray-400 text-center py-8">
                            Yönetmek istediğiniz ilçeyi seçin.
                        </p>
                    )}
                </div>
            )}

            {/* Neighborhood tab */}
            {activeTab === 'neighborhood' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">İlçe Seç</label>
                            <select
                                value={adminNeighborhoodDistrictId}
                                onChange={e => {
                                    setAdminNeighborhoodDistrictId(e.target.value);
                                    setAdminNeighborhoodId('');
                                }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- İlçe seçiniz --</option>
                                {[...allDistricts]
                                    .sort((a, b) => turkishCompare(a.name, b.name))
                                    .map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mahalle Seç</label>
                            <select
                                value={adminNeighborhoodId}
                                onChange={e => setAdminNeighborhoodId(e.target.value)}
                                disabled={!adminNeighborhoodDistrictId || loadingAdminNeighborhoods}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <option value="">
                                    {loadingAdminNeighborhoods
                                        ? 'Yükleniyor...'
                                        : adminNeighborhoodDistrictId
                                        ? '-- Mahalle seçiniz --'
                                        : '-- Önce ilçe seçin --'}
                                </option>
                                {[...adminNeighborhoods]
                                    .sort((a, b) => turkishCompare(a.name, b.name))
                                    .map(n => (
                                        <option key={n.id} value={n.id}>
                                            {n.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {adminNeighborhoodId ? (
                        <NeighborhoodSection
                            key={adminNeighborhoodId}
                            neighborhoodId={adminNeighborhoodId}
                            neighborhood={adminSelectedNeighborhood}
                            districtName={adminSelectedNeighborhoodDistrict?.name}
                        />
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">
                            Yönetmek istediğiniz ilçe ve mahalleyi seçin.
                        </p>
                    )}
                </div>
            )}

            {/* Intelligence Graph tab */}
            {activeTab === 'intelligence' && (
                <IntelligenceGraph
                    events={intelligenceEvents}
                    onRefresh={() => refetchIntel()}
                    isRefreshing={fetchingIntel}
                />
            )}
        </div>
    );
};
