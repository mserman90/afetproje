import { DisasterType, SimulationParams, SimulationResults, TargetZone } from '@/types/hazard';

const DISASTER_WEIGHTS: Record<DisasterType, { i: number; e: number; v: number; r: number }> = {
    seismic: { i: 1.8, e: 1.0, v: 2.0, r: 2.0 },
    flood: { i: 1.2, e: 1.8, v: 1.2, r: 1.5 },
    wildfire: { i: 1.5, e: 1.2, v: 1.5, r: 1.8 },
    conflict: { i: 2.0, e: 1.5, v: 2.0, r: 1.0 },
    airpollution: { i: 1.0, e: 2.0, v: 1.0, r: 1.2 },
    drought: { i: 1.5, e: 1.5, v: 1.0, r: 2.0 },
    storm: { i: 1.8, e: 1.2, v: 1.5, r: 1.5 },
    aviation: { i: 1.2, e: 1.0, v: 1.8, r: 2.0 }
};

export function runProbabilisticEngine(
    type: DisasterType,
    params: SimulationParams,
    target?: TargetZone | null
): SimulationResults {
    let { intensity: I, exposure: E, vulnerability: V, resilience: R, cascade: C } = params;

    const w = DISASTER_WEIGHTS[type] || DISASTER_WEIGHTS.seismic;

    // GERÇEK DÜNYA VE BÖLGESEL KALİBRASYON
    if (target) {
        // 1. Meteorolojik Çarpan
        if (target.weather) {
            const { windSpeed, precipitation } = target.weather;
            if (type === 'storm') I = Math.min(100, I * (1 + windSpeed / 100));
            if (type === 'flood') I = Math.min(100, I * (1 + precipitation / 50));
            if (type === 'wildfire' && windSpeed > 30) I = Math.min(100, I * 1.25);
        }

        // 2. Kritik Altyapı ve Bina Yoğunluğu Çarpanı
        if (target.infra) {
            const { densityScore, buildingCount } = target.infra;
            E = Math.min(100, E * (1 + densityScore / 200));
            if (buildingCount > 1000) {
                V = Math.min(100, V * 1.15);
            }
        }
    }

    // Normalleştirilmiş Risk Puanı (0.01 - 1.00)
    const rawRisk = (Math.pow(I / 100, 1.2) * w.i + Math.pow(E / 100, 1.1) * w.e + (V / 100) * w.v - (R / 100) * w.r) / 3.0;
    const normalizeRisk = Math.max(0.01, Math.min(rawRisk, 1.0));

    // MDR: Ortalama Hasar Oranı (Mean Damage Ratio - % 0 - 100)
    const mdr = Math.min(1.0, Math.pow(I / 100, 1.5) * (V / 100));

    // PML: Olası Maksimum Kayıp (Milyon USD)
    const pml = (E * 500) * mdr * (1 + (C / 100) * 0.5) * (1 - (R / 100) * 0.3);

    // AAL: Yıllık Ortalama Kayıp (Milyon USD)
    const aal = pml * Math.max(0.01, 1 - (I / 100));

    // Altyapı Çökme Riski (% 0 - 99)
    const infraCollapse = Math.min(99, mdr * 100 * 1.2 * (1 + (w.v - 1.5) * 0.2));

    const cascadeScenario = generateCascadeScenario(type, normalizeRisk, pml, target?.name);

    return {
        normalizeRisk: Number(normalizeRisk.toFixed(3)),
        mdr: Number((mdr * 100).toFixed(1)),
        pml: Number(pml.toFixed(1)),
        aal: Number(aal.toFixed(2)),
        infraCollapse: Number(infraCollapse.toFixed(1)),
        cascadeScenario
    };
}

function generateCascadeScenario(type: DisasterType, risk: number, pml: number, regionName?: string): string {
    const loc = regionName ? `${regionName} bölgesi` : 'Bölge';
    const severity = risk > 0.7 ? 'KRİTİK TEHLİKE' : risk > 0.4 ? 'YÜKSEK RİSK' : 'ORTA SEVİYE';

    const scenarios: Record<DisasterType, string> = {
        seismic: `[${severity}] ${loc} için sismik kırılma kaskadı: Ana deprem sarsıntısı sonrası tahmini ${Math.round(risk * 18) + 4} adet hissedilir artçı beklenmektedir. Doğalgaz dağıtım şebekesinde kaçak ve ikincil yangın riski %${Math.round(risk * 65)}. İçme suyu ve kanalizasyon boru hatları hasarı sebebiyle tahmini $${Math.round(pml * 0.3)}M ek altyapı kaybı ve lojistik arterlerde tıkanma öngörülmektedir.`,
        flood: `[${severity}] ${loc} taşkın ve ani su baskını kaskadı: Drenaj kapasitesinin aşılmasıyla zemin sıvılaşması ve heyelan riski %${Math.round(risk * 55)}. Ulaşım aksları ve trafo merkezleri su altında kalabilir; tahmini doğrudan zarar $${Math.round(pml * 0.4)}M. Şebeke suyu kirliliği sebebiyle salgın hastalık riski ${risk > 0.6 ? 'YÜKSEK' : 'ORTA'}.`,
        wildfire: `[${severity}] ${loc} yangın kaskadı: Şiddetli rüzgar ve kuru hava koşullarıyla ${Math.round(pml * 0.25)} hektarlık alan risk altında. Duman partikül yoğunluğu (PM2.5) solunum sağlığını tehdit edebilir. Elektrik iletim hatlarının kesilmesi riski %${Math.round(risk * 70)}.`,
        conflict: `[${severity}] ${loc} acil güvenlik kaskadı: Sivil hareketlilik ve tahliye ihtiyacı yaklaşık ${Math.round(pml * 180)} kişiyi kapsayabilir. İletişim altyapısı ve acil servis koridorları kesintiye uğrayabilir. İnsani yardım lojistiği maliyeti $${Math.round(pml * 0.5)}M.`,
        airpollution: `[${severity}] ${loc} hava kirliliği kaskadı: Terselme (inversiyon) etkisiyle partikül madde konsantrasyonu güvenli sınırın ${Math.round(2 + risk * 8)} katına çıkabilir. Kronik solunum ve kalp rahatsızlıkları acil servis başvurularında %${Math.round(risk * 110)} artış öngörülmektedir.`,
        drought: `[${severity}] ${loc} kuraklık ve su stresi kaskadı: Baraj doluluk oranları kritik eşik olan %${Math.round(100 - risk * 75)} seviyesine gerileyebilir. İkincil hidroelektrik ve tarımsal kayıp $${Math.round(pml * 0.6)}M.`,
        storm: `[${severity}] ${loc} fırtına ve şiddetli rüzgar kaskadı: Anlık rüzgar hamleleri ${Math.round(75 + risk * 65)} km/s seviyesine ulaşabilir. Çatı uçmaları, vinç/ağaç devrilmeleri ve yerel trafo patlamaları sonucu elektrik kesintisi süresi ~${Math.round(risk * 36)} saati bulabilir.`,
        aviation: `[${severity}] ${loc} havacılık ve hava sahası aksaması: Görüş mesafesi düşüşü veya pist riskleri nedeniyle hava sahası kısıtlaması ${Math.round(risk * 24)} saat sürebilir; ~${Math.round(risk * 120)} uçuş alternatif meydanlara yönlendirilebilir.`
    };

    return scenarios[type] || `[${severity}] Genel kaskad senaryosu aktif. Toplam hasar tahmini: $${pml.toFixed(1)}M.`;
}
