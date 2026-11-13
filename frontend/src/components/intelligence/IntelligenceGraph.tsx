import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
    Activity, 
    Globe, 
    RefreshCw, 
    AlertTriangle, 
    Radio, 
    MapPin, 
    ExternalLink, 
    Layers, 
    X,
    Filter,
    ShieldAlert,
    Network
} from 'lucide-react';
import { IntelligenceEvent } from '@/types/hazard';
import { Button, Badge } from '@/components/ui';

interface IntelligenceGraphProps {
    events: IntelligenceEvent[];
    onRefresh: () => void;
    isRefreshing: boolean;
}

const COLORS: Record<string, string> = {
    earthquake: '#f97316',      // Turuncu
    disaster: '#ef4444',        // Kırmızı
    space_weather: '#eab308',   // Sarı
    regional_threat: '#ec4899', // Pembe
    osint: '#64748b',           // Slate
    location: '#3b82f6',        // Mavi
    category: '#10b981',        // Zümrüt Yeşil
    anomaly: '#dc2626'          // Koyu Kırmızı
};

declare global {
    interface Window {
        cytoscape?: any;
    }
}

export const IntelligenceGraph: React.FC<IntelligenceGraphProps> = ({ events, onRefresh, isRefreshing }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyInstanceRef = useRef<any>(null);
    const [selectedItem, setSelectedItem] = useState<{ id: string; label: string; type: string; details?: any } | null>(null);
    const [filterType, setFilterType] = useState<string>('all');
    const [cyLoaded, setCyLoaded] = useState<boolean>(false);

    // Cytoscape kütüphanesini dinamik yükleme (NPM veya CDN fallback ile garantili çalışma)
    useEffect(() => {
        if (window.cytoscape) {
            setCyLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.2/cytoscape.min.js';
        script.async = true;
        script.onload = () => setCyLoaded(true);
        script.onerror = () => setCyLoaded(false);
        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    // Filtrelenmiş olaylar
    const filteredEvents = useMemo(() => {
        if (filterType === 'all') return events;
        if (filterType === 'anomaly') return events.filter(e => e.isAnomaly);
        return events.filter(e => e.type === filterType);
    }, [events, filterType]);

    // Cytoscape elemanlarını hazırla (Nodes & Edges)
    const elements = useMemo(() => {
        const nodes: any[] = [];
        const edges: any[] = [];
        const entityMap = new Map<string, { label: string; type: string }>();

        filteredEvents.forEach(ev => {
            // Olay düğümü
            nodes.push({
                data: {
                    id: ev.id,
                    label: ev.title.length > 25 ? ev.title.substring(0, 25) + '...' : ev.title,
                    fullTitle: ev.title,
                    type: ev.type,
                    color: ev.isAnomaly ? COLORS.anomaly : (COLORS[ev.type] || '#64748b'),
                    isEvent: true,
                    isAnomaly: ev.isAnomaly,
                    summary: ev.summary,
                    link: ev.link,
                    timestamp: ev.timestamp
                }
            });

            // Varlık (Entity) düğümleri ve bağlantılar
            ev.entities?.forEach(ent => {
                const entId = `ent_${ent.type}_${ent.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                if (!entityMap.has(entId)) {
                    entityMap.set(entId, { label: ent.label, type: ent.type });
                    nodes.push({
                        data: {
                            id: entId,
                            label: ent.label,
                            fullTitle: ent.label,
                            type: ent.type,
                            color: COLORS[ent.type] || '#3b82f6',
                            isEvent: false
                        }
                    });
                }

                // Kenar (Edge)
                edges.push({
                    data: {
                        id: `edge_${ev.id}_${entId}`,
                        source: ev.id,
                        target: entId,
                        label: ent.type === 'location' ? 'ETKİ ALANI' : ent.type === 'anomaly' ? 'KRİTİK TEHDİT' : 'İLİŞKİLİ'
                    }
                });
            });
        });

        return [...nodes, ...edges];
    }, [filteredEvents]);

    // Cytoscape grafını çiz / güncelle
    useEffect(() => {
        if (!cyLoaded || !containerRef.current || !window.cytoscape) return;

        try {
            if (cyInstanceRef.current) {
                cyInstanceRef.current.destroy();
            }

            const cy = window.cytoscape({
                container: containerRef.current,
                elements,
                style: [
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'background-color': 'data(color)',
                            'color': '#1e293b',
                            'font-size': '11px',
                            'font-weight': 'bold',
                            'text-valign': 'bottom',
                            'text-margin-y': 6,
                            'width': 'mapData(isAnomaly, 0, 1, 32, 42)',
                            'height': 'mapData(isAnomaly, 0, 1, 32, 42)',
                            'border-width': 2,
                            'border-color': '#ffffff',
                            'text-background-opacity': 0.8,
                            'text-background-color': '#ffffff',
                            'text-background-padding': '3px',
                            'text-background-shape': 'roundrectangle'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 1.5,
                            'line-color': '#cbd5e1',
                            'target-arrow-color': '#94a3b8',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                            'arrow-scale': 0.8
                        }
                    },
                    {
                        selector: 'node:selected',
                        style: {
                            'border-width': 4,
                            'border-color': '#4f46e5',
                            'text-background-color': '#e0e7ff'
                        }
                    }
                ],
                layout: {
                    name: 'concentric',
                    fit: true,
                    padding: 30,
                    animate: false
                }
            });

            cy.on('tap', 'node', (evt: any) => {
                const node = evt.target;
                const d = node.data();
                setSelectedItem({
                    id: d.id,
                    label: d.fullTitle || d.label,
                    type: d.type,
                    details: d
                });
            });

            cy.on('tap', (evt: any) => {
                if (evt.target === cy) {
                    setSelectedItem(null);
                }
            });

            cyInstanceRef.current = cy;
        } catch {
            // Render hatası olursa tolerans
        }

        return () => {
            if (cyInstanceRef.current) {
                cyInstanceRef.current.destroy();
                cyInstanceRef.current = null;
            }
        };
    }, [elements, cyLoaded]);

    const anomaliesCount = useMemo(() => events.filter(e => e.isAnomaly).length, [events]);

    return (
        <div className="space-y-4">
            {/* Üst Bilgi ve Eylem Çubuğu */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Network className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h3 className="text-base font-bold text-gray-900">Canlı Tehdit ve İlişki Bilgi Grafı</h3>
                            <Badge variant="neutral">Keyless & Canlı OSINT</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            USGS, Open-Meteo, NOAA ve GDACS açık kaynaklarından toplanan sismik, meteorolojik ve altyapı tehditlerinin ilişkisel haritası.
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onRefresh}
                        loading={isRefreshing}
                        leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
                    >
                        Canlı Verileri Kazı
                    </Button>
                </div>
            </div>

            {/* Anomali Uyarısı (Varsa) */}
            {anomaliesCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                            Sistemde <strong>{anomaliesCount} adet</strong> kritik anomali (şiddetli rüzgar / sığ deprem / iletişim uyarısı) tespit edildi.
                        </span>
                    </div>
                    <button
                        onClick={() => setFilterType('anomaly')}
                        className="font-bold underline text-amber-800 hover:text-amber-950 ml-2"
                    >
                        Anomalileri Göster
                    </button>
                </div>
            )}

            {/* Filtre Butonları */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 flex items-center mr-1">
                    <Filter className="w-3.5 h-3.5 mr-1" /> Filtre:
                </span>
                <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        filterType === 'all'
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Tümü ({events.length})
                </button>
                <button
                    onClick={() => setFilterType('earthquake')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        filterType === 'earthquake'
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Depremler
                </button>
                <button
                    onClick={() => setFilterType('disaster')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        filterType === 'disaster'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Meteoroloji & GDACS
                </button>
                <button
                    onClick={() => setFilterType('space_weather')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        filterType === 'space_weather'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    İletişim & Uzay Havası
                </button>
                <button
                    onClick={() => setFilterType('anomaly')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        filterType === 'anomaly'
                            ? 'bg-rose-700 text-white border-rose-700'
                            : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    }`}
                >
                    🚨 Kritik Anomaliler ({anomaliesCount})
                </button>
            </div>

            {/* Graf Canvas ve Detay Çerçevesi */}
            <div className="relative bg-slate-900 rounded-xl border border-slate-800 shadow-inner overflow-hidden h-[540px]">
                {/* Cytoscape Konteyneri */}
                <div ref={containerRef} className="w-full h-full" />

                {/* Graf Yüklenirken veya Boş Durum */}
                {(!cyLoaded || elements.length === 0) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/90 p-4 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-400" />
                        <span className="text-sm font-medium">Açık kaynak istihbarat ağı taranıyor...</span>
                        <span className="text-xs text-slate-500 mt-1">USGS, Open-Meteo ve NOAA verileri işleniyor</span>
                    </div>
                )}

                {/* Sol Alt Lejant */}
                <div className="absolute bottom-3 left-3 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-2.5 text-[11px] text-slate-300 space-y-1.5 pointer-events-none">
                    <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                        <span>Sismik / Deprem</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                        <span>Meteoroloji / Taşkın</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
                        <span>İletişim & Uzay Havası</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                        <span>Konum / Etki Alanı</span>
                    </div>
                </div>

                {/* Sağ Taraf: Seçilen Düğümün Detay Kartı */}
                {selectedItem && (
                    <div className="absolute top-3 right-3 bottom-3 w-80 bg-white/95 backdrop-blur-md rounded-lg border border-gray-200 shadow-xl p-4 flex flex-col justify-between overflow-y-auto">
                        <div>
                            <div className="flex items-start justify-between">
                                <span className="text-[11px] font-semibold tracking-wide uppercase text-indigo-600 block">
                                    {selectedItem.details?.isEvent ? 'Afet / İstihbarat Olayı' : 'Varlık & Tehdit İlişkisi'}
                                </span>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <h4 className="text-sm font-bold text-gray-900 mt-1 leading-snug">
                                {selectedItem.label}
                            </h4>

                            {selectedItem.details?.isAnomaly && (
                                <div className="mt-2.5 p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                                    <strong>Kritik Anomali Uyarısı:</strong> {selectedItem.details?.anomalyReason || 'Standart dışı risk artışı'}
                                </div>
                            )}

                            {selectedItem.details?.summary && (
                                <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                                    {selectedItem.details.summary}
                                </p>
                            )}

                            {selectedItem.details?.timestamp && (
                                <div className="text-[11px] text-gray-400 mt-3">
                                    Kayıt Zamanı: {new Date(selectedItem.details.timestamp).toLocaleString('tr-TR')}
                                </div>
                            )}
                        </div>

                        {selectedItem.details?.link && (
                            <div className="pt-3 border-t border-gray-200 mt-4">
                                <a
                                    href={selectedItem.details.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Resmi Kaynağı Görüntüle</span>
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
