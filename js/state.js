// Global Application State
export const AppState = {
    map: null,
    markers: [],
    radarMarkers: [],
    professionals: [],
    userLocation: { lat: -12.0464, lng: -77.0428 }, // Default: Lima
    selectedFilter: 'all',
    selectedProfessional: null,
    user: null,
    serviceListenerUnsubscribe: null,
    radarListenerUnsubscribe: null,
    professionalsListenerUnsubscribe: null,
    companiesListenerUnsubscribe: null,
    categories: [
        { id: 'prevencion', name: 'Prevención' },
        { id: 'electricidad', name: 'Eléctricista' },
        { id: 'drywall', name: 'Drywall' },
        { id: 'hogar', name: 'Hogar' }
    ]
};
