import React, { useState, useEffect } from 'react';
import { 
    Activity, 
    Droplets, 
    Flame, 
    CloudRain, 
    Wind, 
    Sun, 
    Skull, 
    Plane, 
    RefreshCw, 
    Building2, 
    AlertTriangle, 
    CheckCircle2, 
    TrendingUp, 
    DollarSign, 
    ShieldCheck, 
    Zap,
    MapPin,
    HeartPulse,
    School
} from 'lucide-react';
import { DisasterType, SimulationParams, SimulationResults, TargetZone } from '@/types/hazard';
import { runProbabilisticEngine } from '@/lib/disasterEngine';
import { fetchWeatherData, fetchWeatherAlerts, fetchInfraData } from '@/services/hazardApiService';
import { ISTANBUL_DISTRICTS_GEO, findDistrictGeo } from '@/config/istanbulDistricts';
import { Button, Badge } from '@/components/ui';

const DISASTER_INFO: Record<DisasterType, { label: string; icon: React.ReactNode; color: string }> = {
    seismic: { label: 'Sismik (Deprem)', icon: <Activity className="w-4 h-4" />, color: 'bg-red-50 text-red-700 border-red-200' },
    flood: { label: 'Sel / Taşkın', icon: <Droplets className="w-4 h-4" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    storm: { label: 'Fırtına & Hortum', icon: <CloudRain className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    wildfire: { label: 'Orman / Kentsel Yangın', icon: <Flame className="w-4 h-4" />, color: 'bg-orange-50 text-orange-700 border-orange-200' },
    airpollution: { label: 'Hava Kirliliği & Gaz', icon: <Wind className="w-4 h-4" />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    drought: { label: 'Kuraklık / Su Stresi', icon: <Sun className="w-4 h-4" />, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    conflict: { label: 'Acil Güvenlik / Çatışma', icon: <Skull className="w-4 h-4" />, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    aviation: { label: 'Hava Sahası / Ulaşım', icon: <Plane className="w-4 h-4" />, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
};

export const ProbabilisticSimulationSection: React.FC = () => {
    const [disasterType, setDisasterType] = useState<DisasterType>('seismic');
    const [selectedDistrictKey, setSelectedDistrictKey] = useState<string>('kadikoy');
    const [targetZone, setTargetZone] = useState<TargetZone | null>(null);
    const [isFetchingEnv, setIsFetchingEnv] = useState<boolean>(false);

    const [params, setParams] = useState<SimulationParams>({
        intensity: 65,
        exposure: 70,
        vulnerability: 65,
        resilience: 50,
        cascade: 55
    });

    const [results, setResults] = useState<SimulationResults | null>(null);

    // İlçe değiştiğinde hedef bölgeyi güncelle ve canlı verileri sorgula
    useEffect(() => {
        const geo = ISTANBUL_DISTRICTS_GEO[selectedDistrictKey] || ISTANBUL_DISTRICTS_GEO['kadikoy'];
        const initialTarget: TargetZone = {
            name: geo.name,
            districtId: geo.id,
            lat: geo.lat,
            lng: geo.lng
        };
        setTargetZone(initialTarget);
        setParams(prev => ({
            ...prev,
            vulnerability: geo.defaultVulnerability
        }));

        loadEnvironmentalData(geo.lat, geo.lng, geo.name, geo.id);
    }, [selectedDistrictKey]);

    const loadEnvironmentalData = async (lat: number, lng: number, name: string, id: string) => {
        setIsFetchingEnv(true);
        try {
            const [weather, alerts, infra] = await Promise.all([
                fetchWeatherData(lat, lng),
                fetchWeatherAlerts(lat, lng),
                fetchInfraData(lat, lng)
            ]);

            const updatedZone: TargetZone = {
                name,
                districtId: id,
                lat,
                lng,
                weather: weather || undefined,
                alerts,
                infra
            };

            setTargetZone(updatedZone);

            // Simülasyonu güncel çevre verileriyle otomatik güncelle
            const initialRes = runProbabilisticEngine(disasterType, params, updatedZone);
            setResults(initialRes);
        } catch {
            // Hata olsa da motoru çalıştır
            const initialRes = runProbabilisticEngine(disasterType, params, targetZone);
            setResults(initialRes);
        } finally {
            setIsFetchingEnv(false);
        }
    };

    const handleRunSimulation = () => {
        const res = runProbabilisticEngine(disasterType, params, targetZone);
        setResults(res);
    };

    const getRiskBadge = (risk: number) => {
        if (risk >= 0.7) return <Badge variant="danger">KRİTİK ({risk})</Badge>;
        if (risk >= 0.4) return <Badge variant="warning">YÜKSEK ({risk})</Badge>;
        return <Badge variant="success">ORTA / KONTROLLÜ ({risk})</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Üst Bilgilendirme Kartı */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-lg border border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Gözcü Olasılıksal Afet & Hasar Motoru</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">İstanbul Bölgesel Afet ve Kaskad Hasar Simülatörü</h2>
                        <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                            Gerçek zamanlı OpenStreetMap kritik altyapı verileri, Open-Meteo meteoroloji akışları ve olasılıksal risk algoritmalarıyla olası senaryoları modelleyin.
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <select
                            value={selectedDistrictKey}
                            onChange={(e) => setSelectedDistrictKey(e.target.value)}
                            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                            {Object.values(ISTANBUL_DISTRICTS_GEO).map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} ({d.lat.toFixed(2)}, {d.lng.toFixed(2)})
                                </option>
                            ))}
                        </select>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                if (targetZone) {
                                    loadEnvironmentalData(targetZone.lat, targetZone.lng, targetZone.name, targetZone.districtId || '');
                                }
                            }}
                            loading={isFetchingEnv}
                            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetchingEnv ? 'animate-spin' : ''}`} />}
                        >
                            Verileri Yenile
                        </Button>
                    </div>
                </div>

                {/* Canlı Çevre & Altyapı Göstergesi */}
                <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-800/60 rounded-lg p-2.5 flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                            <span className="text-slate-400 block">Hedef İlçe:</span>
                            <span className="font-semibold text-white">{targetZone?.name || 'Seçilmedi'}</span>
                        </div>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-2.5 flex items-center space-x-2">
                        <Wind className="w-4 h-4 text-sky-400 shrink-0" />
                        <div>
                            <span className="text-slate-400 block">Hava & Rüzgar:</span>
                            <span className="font-semibold text-white">
                                {targetZone?.weather ? `${targetZone.weather.temp}°C | ${targetZone.weather.windSpeed} km/s` : 'Yükleniyor...'}
                            </span>
                        </div>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-2.5 flex items-center space-x-2">
                        <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                            <span className="text-slate-400 block">Kritik Tesisler (OSM):</span>
                            <span className="font-semibold text-white">
                                {targetZone?.infra ? `${targetZone.infra.hospitalCount} Hastane, ${targetZone.infra.emergencyCount} Acil Birim` : 'Taranıyor...'}
                            </span>
                        </div>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-2.5 flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                            <span className="text-slate-400 block">Bina & Yoğunluk:</span>
                            <span className="font-semibold text-white">
                                {targetZone?.infra ? `${targetZone.infra.buildingCount}+ Yapı (Puan: ${targetZone.infra.densityScore}/100)` : 'Hesaplanıyor...'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Afet Türü Seçimi */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Afet Türü Seçin</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(Object.keys(DISASTER_INFO) as DisasterType[]).map((type) => {
                        const item = DISASTER_INFO[type];
                        const isSelected = disasterType === type;
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setDisasterType(type)}
                                className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                    isSelected
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 shadow-sm'
                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span className={isSelected ? 'text-indigo-600' : 'text-gray-500'}>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Simülasyon Ayar Çubukları ve Sonuç Paneli (2 Sütun) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sol: Ayar Parametreleri */}
                <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center justify-between">
                        <span>Simülasyon Parametreleri</span>
                        <span className="text-xs font-normal text-gray-500">Değerleri ayarlayın</span>
                    </h3>

                    {/* Şiddet */}
                    <div>
                        <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                            <span>Şiddet / Yoğunluk (Intensity)</span>
                            <span className="font-bold text-indigo-600">%{params.intensity}</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={params.intensity}
                            onChange={(e) => setParams({ ...params, intensity: Number(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    {/* Maruziyet */}
                    <div>
                        <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                            <span>Maruziyet & Nüfus (Exposure)</span>
                            <span className="font-bold text-indigo-600">%{params.exposure}</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={params.exposure}
                            onChange={(e) => setParams({ ...params, exposure: Number(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    {/* Kırılganlık */}
                    <div>
                        <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                            <span>Yapısal Kırılganlık (Vulnerability)</span>
                            <span className="font-bold text-indigo-600">%{params.vulnerability}</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={params.vulnerability}
                            onChange={(e) => setParams({ ...params, vulnerability: Number(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    {/* Direnç / Hazırlık */}
                    <div>
                        <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                            <span>Bölgesel Afet Direnci (Resilience)</span>
                            <span className="font-bold text-emerald-600">%{params.resilience}</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={params.resilience}
                            onChange={(e) => setParams({ ...params, resilience: Number(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                    </div>

                    {/* Kaskad Çarpanı */}
                    <div>
                        <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                            <span>Zincirleme Kaskad Çarpanı (Cascade)</span>
                            <span className="font-bold text-rose-600">%{params.cascade}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={params.cascade}
                            onChange={(e) => setParams({ ...params, cascade: Number(e.target.value) })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                        />
                    </div>

                    <Button
                        onClick={handleRunSimulation}
                        variant="primary"
                        className="w-full mt-4"
                        leftIcon={<TrendingUp className="w-4 h-4" />}
                    >
                        Simülasyonu Yeniden Hesapla
                    </Button>
                </div>

                {/* Sağ: Çıktı Metrikleri ve Kaskad Senaryosu */}
                <div className="lg:col-span-7 space-y-4">
                    {results && (
                        <>
                            {/* Temel Metrik Kartları */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* Normalleştirilmiş Risk */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <span className="text-xs text-gray-500 font-medium block">Normalleştirilmiş Risk</span>
                                    <div className="mt-1 flex items-baseline justify-between">
                                        <span className="text-2xl font-bold text-gray-900">{results.normalizeRisk}</span>
                                    </div>
                                    <div className="mt-2">{getRiskBadge(results.normalizeRisk)}</div>
                                </div>

                                {/* Ortalama Hasar Oranı (MDR) */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <span className="text-xs text-gray-500 font-medium block">Ortalama Hasar (MDR)</span>
                                    <div className="mt-1 flex items-baseline justify-between">
                                        <span className="text-2xl font-bold text-red-600">%{results.mdr}</span>
                                    </div>
                                    <span className="text-[11px] text-gray-400 block mt-2">Yapı stoğu hasar oranı</span>
                                </div>

                                {/* Olası Maksimum Kayıp (PML) */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <span className="text-xs text-gray-500 font-medium block">Maks. Kayıp (PML)</span>
                                    <div className="mt-1 flex items-baseline justify-between">
                                        <span className="text-2xl font-bold text-amber-600">${results.pml}M</span>
                                    </div>
                                    <span className="text-[11px] text-gray-400 block mt-2">Ekonomik zarar öngörüsü</span>
                                </div>

                                {/* Altyapı Çökme Riski */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <span className="text-xs text-gray-500 font-medium block">Altyapı Çökme Riski</span>
                                    <div className="mt-1 flex items-baseline justify-between">
                                        <span className="text-2xl font-bold text-rose-600">%{results.infraCollapse}</span>
                                    </div>
                                    <span className="text-[11px] text-gray-400 block mt-2">Şebeke/ulaşım aksaması</span>
                                </div>
                            </div>

                            {/* Zincirleme Kaskad Senaryo Kutusu */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                                <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    <span>Öngörülen Kaskad (Zincirleme) Afet Senaryosu</span>
                                </h4>
                                <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 text-amber-950 text-sm leading-relaxed">
                                    {results.cascadeScenario}
                                </div>

                                {/* Bölgedeki Kritik Tesisler Listesi */}
                                {targetZone?.infra?.facilities && targetZone.infra.facilities.length > 0 && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-xs font-semibold text-gray-600 block mb-2">
                                            Doğrulanmış Bölgesel Kritik Tesisler (İlk {Math.min(targetZone.infra.facilities.length, 4)} Tesis):
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {targetZone.infra.facilities.slice(0, 4).map((f, idx) => (
                                                <div key={idx} className="flex items-center space-x-2 text-xs bg-gray-50 p-2 rounded border border-gray-200/80">
                                                    {f.type === 'hospital' ? (
                                                        <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                    ) : f.type === 'school' ? (
                                                        <School className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                    ) : (
                                                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    )}
                                                    <span className="truncate text-gray-800 font-medium">{f.name || f.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
