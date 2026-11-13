export interface DistrictGeoInfo {
    id: string;
    name: string;
    lat: number;
    lng: number;
    defaultVulnerability: number; // 0-100 base vulnerability
}

export const ISTANBUL_DISTRICTS_GEO: Record<string, DistrictGeoInfo> = {
    'adalar': { id: 'adalar', name: 'Adalar', lat: 40.8753, lng: 29.1309, defaultVulnerability: 65 },
    'arnavutkoy': { id: 'arnavutkoy', name: 'Arnavutköy', lat: 41.1852, lng: 28.7408, defaultVulnerability: 45 },
    'atasehir': { id: 'atasehir', name: 'Ataşehir', lat: 40.9839, lng: 29.1123, defaultVulnerability: 50 },
    'avcilar': { id: 'avcilar', name: 'Avcılar', lat: 40.9801, lng: 28.7175, defaultVulnerability: 85 },
    'bagcilar': { id: 'bagcilar', name: 'Bağcılar', lat: 41.0343, lng: 28.8572, defaultVulnerability: 80 },
    'bahcelievler': { id: 'bahcelievler', name: 'Bahçelievler', lat: 41.0003, lng: 28.8638, defaultVulnerability: 80 },
    'bakirkoy': { id: 'bakirkoy', name: 'Bakırköy', lat: 40.9782, lng: 28.8744, defaultVulnerability: 75 },
    'basaksehir': { id: 'basaksehir', name: 'Başakşehir', lat: 41.0975, lng: 28.8064, defaultVulnerability: 50 },
    'bayrampasa': { id: 'bayrampasa', name: 'Bayrampaşa', lat: 41.0487, lng: 28.9022, defaultVulnerability: 70 },
    'besiktas': { id: 'besiktas', name: 'Beşiktaş', lat: 41.0428, lng: 29.0077, defaultVulnerability: 60 },
    'beykoz': { id: 'beykoz', name: 'Beykoz', lat: 41.1275, lng: 29.1009, defaultVulnerability: 45 },
    'beylikduzu': { id: 'beylikduzu', name: 'Beylikdüzü', lat: 40.9912, lng: 28.6498, defaultVulnerability: 65 },
    'beyoglu': { id: 'beyoglu', name: 'Beyoğlu', lat: 41.0370, lng: 28.9772, defaultVulnerability: 75 },
    'buyukcekmece': { id: 'buyukcekmece', name: 'Büyükçekmece', lat: 41.0216, lng: 28.5833, defaultVulnerability: 70 },
    'catalca': { id: 'catalca', name: 'Çatalca', lat: 41.1436, lng: 28.4614, defaultVulnerability: 40 },
    'cekmekoy': { id: 'cekmekoy', name: 'Çekmeköy', lat: 41.0351, lng: 29.1764, defaultVulnerability: 45 },
    'esenler': { id: 'esenler', name: 'Esenler', lat: 41.0392, lng: 28.8897, defaultVulnerability: 80 },
    'esenyurt': { id: 'esenyurt', name: 'Esenyurt', lat: 41.0343, lng: 28.6801, defaultVulnerability: 75 },
    'eyupsultan': { id: 'eyupsultan', name: 'Eyüpsultan', lat: 41.0480, lng: 28.9333, defaultVulnerability: 65 },
    'fatih': { id: 'fatih', name: 'Fatih', lat: 41.0186, lng: 28.9396, defaultVulnerability: 90 },
    'gaziosmanpasa': { id: 'gaziosmanpasa', name: 'Gaziosmanpaşa', lat: 41.0574, lng: 28.9157, defaultVulnerability: 70 },
    'gungoren': { id: 'gungoren', name: 'Güngören', lat: 41.0205, lng: 28.8722, defaultVulnerability: 80 },
    'kadikoy': { id: 'kadikoy', name: 'Kadıköy', lat: 40.9901, lng: 29.0292, defaultVulnerability: 70 },
    'kagithane': { id: 'kagithane', name: 'Kağıthane', lat: 41.0812, lng: 28.9742, defaultVulnerability: 65 },
    'kartal': { id: 'kartal', name: 'Kartal', lat: 40.8906, lng: 29.1947, defaultVulnerability: 65 },
    'kucukcekmece': { id: 'kucukcekmece', name: 'Küçükçekmece', lat: 40.9919, lng: 28.7712, defaultVulnerability: 85 },
    'maltepe': { id: 'maltepe', name: 'Maltepe', lat: 40.9247, lng: 29.1311, defaultVulnerability: 65 },
    'pendik': { id: 'pendik', name: 'Pendik', lat: 40.8767, lng: 29.2333, defaultVulnerability: 60 },
    'sancaktepe': { id: 'sancaktepe', name: 'Sancaktepe', lat: 41.0041, lng: 29.2272, defaultVulnerability: 55 },
    'sariyer': { id: 'sariyer', name: 'Sarıyer', lat: 41.1667, lng: 29.0500, defaultVulnerability: 50 },
    'silivri': { id: 'silivri', name: 'Silivri', lat: 41.0736, lng: 28.2475, defaultVulnerability: 65 },
    'sultanbeyli': { id: 'sultanbeyli', name: 'Sultanbeyli', lat: 40.9667, lng: 29.2667, defaultVulnerability: 70 },
    'sultangazi': { id: 'sultangazi', name: 'Sultangazi', lat: 41.1044, lng: 28.8689, defaultVulnerability: 65 },
    'sile': { id: 'sile', name: 'Şile', lat: 41.1758, lng: 29.6133, defaultVulnerability: 40 },
    'sisli': { id: 'sisli', name: 'Şişli', lat: 41.0602, lng: 28.9877, defaultVulnerability: 70 },
    'tuzla': { id: 'tuzla', name: 'Tuzla', lat: 40.8153, lng: 29.3097, defaultVulnerability: 65 },
    'umraniye': { id: 'umraniye', name: 'Ümraniye', lat: 41.0253, lng: 29.1172, defaultVulnerability: 60 },
    'uskudar': { id: 'uskudar', name: 'Üsküdar', lat: 41.0264, lng: 29.0153, defaultVulnerability: 65 },
    'zeytinburnu': { id: 'zeytinburnu', name: 'Zeytinburnu', lat: 40.9881, lng: 28.9036, defaultVulnerability: 85 }
};

export function findDistrictGeo(nameOrId: string): DistrictGeoInfo | undefined {
    const normalized = nameOrId
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .trim();

    return Object.values(ISTANBUL_DISTRICTS_GEO).find(d => {
        const dNorm = d.name.toLowerCase()
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c');
        return d.id === normalized || dNorm === normalized || dNorm.includes(normalized) || normalized.includes(dNorm);
    });
}
