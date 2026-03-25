// Mock Data for "Backend"
export const MOCK_DB = [
    {
        id: "p1",
        name: "Carlos Mendoza",
        specialty: "Tecnico",
        experience: "5 años Exp. en Construcción",
        rate: 125,
        rating: 4.8,
        certifications: ["Primeros Auxilios Avanzados", "Trabajos en Altura", "Manejo de Extintores"],
        img: "https://randomuser.me/api/portraits/men/32.jpg",
        location: { lat: -12.0970, lng: -77.0370 } // San Isidro
    },
    {
        id: "p2",
        name: "Diana Rojas",
        specialty: "Tecnico",
        experience: "3 años Exp. en Industria",
        rate: 125,
        rating: 4.9,
        certifications: ["Identificación de Peligros (IPERC)", "Evaluación de Riesgos", "Primeros Auxilios Básicos"],
        img: "https://randomuser.me/api/portraits/women/44.jpg",
        location: { lat: -12.1001, lng: -77.0315 }
    },
    {
        id: "p3",
        name: "Ing. Jorge Vasquez",
        specialty: "Universitario",
        experience: "8 años Exp. en Minería",
        rate: 180,
        rating: 5.0,
        certifications: ["Auditor Trinorma ISO", "Supervisión SSOMA", "Ing. de Seguridad Minera"],
        img: "https://randomuser.me/api/portraits/men/65.jpg",
        location: { lat: -12.1120, lng: -77.0350 }
    },
    {
        id: "p4",
        name: "Ing. Luis Garcia",
        specialty: "Ing Colegiado",
        experience: "12 años Exp. Múltiple",
        rate: 250,
        rating: 4.9,
        certifications: ["Colegiatura CIP Habilitada", "Maestría en Seguridad Industrial", "Especialista en SST"],
        img: "https://randomuser.me/api/portraits/men/85.jpg",
        location: { lat: -12.1220, lng: -77.0250 } // Miraflores
    }
];

export const getProfessionals = (filter = 'all') => {
    return new Promise((resolve) => {
        setTimeout(() => {
            if (filter === 'all') resolve(MOCK_DB);
            else resolve(MOCK_DB.filter(p => p.specialty === filter));
        }, 300); // Simulate network latency
    });
};
// Mock API Service
// Currently reading hardcoded responses.
// Later, this module will connect to Firebase/Supabase for real backend integration.
