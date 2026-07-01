// Global Application State
export const AppState = {
    map: null,
    markers: [],
    radarMarkers: [],
    professionals: [],
    userLocation: { lat: -12.0464, lng: -77.0428 }, // Default: Lima
    selectedFilter: 'all',
    selectedProfessional: null,
    user: undefined, // undefined = cargando, null = sin sesión, objeto = sesión activa
    serviceListenerUnsubscribe: null,
    radarListenerUnsubscribe: null,
    professionalsListenerUnsubscribe: null,
    companiesListenerUnsubscribe: null,
    adminListeners: [],
    certificateCourses: [],
    selectedCertCourse: null,
};
