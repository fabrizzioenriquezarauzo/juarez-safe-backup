// =====================================================
// SCRIPT DE SEED - Cargar datos iniciales a Firestore
// =====================================================
// INSTRUCCIONES:
// 1. Abre localhost:8080/#/seed en tu navegador
// 2. Haz clic en el botón "Cargar Datos"
// 3. Una sola vez es suficiente - no repetir
// =====================================================

import { db } from '../services/firebase.js';
import { collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const PROFESSIONALS_SEED = [
    {
        name: "Carlos Mendoza",
        specialty: "Tecnico",
        experience: "5 años Exp. en Construcción",
        rate: 125,
        rating: 4.8,
        ratingCount: 24,
        certifications: ["Primeros Auxilios Avanzados", "Trabajos en Altura", "Manejo de Extintores"],
        img: "https://randomuser.me/api/portraits/men/32.jpg",
        lat: -12.0970,
        lng: -77.0370,
        isOnline: true,
        phone: "999000001"
    },
    {
        name: "Diana Rojas",
        specialty: "Tecnico",
        experience: "3 años Exp. en Industria",
        rate: 125,
        rating: 4.9,
        ratingCount: 31,
        certifications: ["Identificación de Peligros (IPERC)", "Evaluación de Riesgos", "Primeros Auxilios Básicos"],
        img: "https://randomuser.me/api/portraits/women/44.jpg",
        lat: -12.1001,
        lng: -77.0315,
        isOnline: true,
        phone: "999000002"
    },
    {
        name: "Ing. Jorge Vasquez",
        specialty: "Universitario",
        experience: "8 años Exp. en Minería",
        rate: 180,
        rating: 5.0,
        ratingCount: 47,
        certifications: ["Auditor Trinorma ISO", "Supervisión SSOMA", "Ing. de Seguridad Minera"],
        img: "https://randomuser.me/api/portraits/men/65.jpg",
        lat: -12.1120,
        lng: -77.0350,
        isOnline: true,
        phone: "999000003"
    },
    {
        name: "Ing. Luis Garcia",
        specialty: "Ing Colegiado",
        experience: "12 años Exp. Múltiple",
        rate: 250,
        rating: 4.9,
        ratingCount: 58,
        certifications: ["Colegiatura CIP Habilitada", "Maestría en Seguridad Industrial", "Especialista en SST"],
        img: "https://randomuser.me/api/portraits/men/85.jpg",
        lat: -12.1220,
        lng: -77.0250,
        isOnline: true,
        phone: "999000004"
    },
    {
        name: "María Torres",
        specialty: "Tecnico",
        experience: "4 años Exp. en Salud Ocupacional",
        rate: 130,
        rating: 4.7,
        ratingCount: 19,
        certifications: ["Salud Ocupacional", "Ergonomía Industrial", "Gestión de Riesgos"],
        img: "https://randomuser.me/api/portraits/women/28.jpg",
        lat: -12.0850,
        lng: -77.0450,
        isOnline: false,
        phone: "999000005"
    }
];

export const renderSeed = () => {
    return `
        <div style="min-height:100vh; background:#0D1117; display:flex; align-items:center; justify-content:center; font-family:'Plus Jakarta Sans', sans-serif;">
            <div style="background:rgba(22,27,34,0.95); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:48px; max-width:480px; width:100%; text-align:center;">
                <i class="fa-solid fa-database" style="font-size:3rem; color:#2563EB; margin-bottom:24px;"></i>
                <h2 style="color:#FFFFFF; font-size:1.5rem; margin-bottom:8px;">Cargar Datos Iniciales</h2>
                <p style="color:#64748B; margin-bottom:32px; line-height:1.6;">
                    Este proceso cargará los prevencionistas de demostración a Firestore.<br>
                    <strong style="color:#F59E0B;">Solo ejecutar UNA vez.</strong>
                </p>
                <div id="seed-result" style="display:none; padding:16px; border-radius:8px; margin-bottom:24px; font-size:0.9rem;"></div>
                <button id="btn-seed" style="background:#2563EB; color:white; border:none; padding:14px 32px; border-radius:8px; font-size:1rem; font-weight:600; cursor:pointer; width:100%;">
                    <i class="fa-solid fa-upload"></i> Cargar Datos a Firebase
                </button>
                <br><br>
                <a href="#/" style="color:#64748B; font-size:0.85rem;">← Volver al inicio</a>
            </div>
        </div>
    `;
};

export const loadSeed = async () => {
    const btn = document.getElementById('btn-seed');
    const result = document.getElementById('seed-result');

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';
        result.style.display = 'block';
        result.style.background = 'rgba(37,99,235,0.1)';
        result.style.border = '1px solid rgba(37,99,235,0.3)';
        result.style.color = '#60A5FA';
        result.innerHTML = 'Verificando base de datos...';

        try {
            // Verificar si ya hay datos
            const existing = await getDocs(collection(db, "professionals"));
            if (!existing.empty) {
                result.style.background = 'rgba(245,158,11,0.1)';
                result.style.border = '1px solid rgba(245,158,11,0.3)';
                result.style.color = '#FCD34D';
                result.innerHTML = `⚠️ Ya hay ${existing.size} prevencionistas en la base de datos. No es necesario cargar de nuevo.`;
                btn.innerHTML = 'Ya cargado';
                return;
            }

            // Cargar profesionales
            const profRef = collection(db, "professionals");
            let count = 0;
            for (const prof of PROFESSIONALS_SEED) {
                await addDoc(profRef, {
                    ...prof,
                    createdAt: serverTimestamp()
                });
                count++;
                result.innerHTML = `Cargando... (${count}/${PROFESSIONALS_SEED.length})`;
            }

            result.style.background = 'rgba(16,185,129,0.1)';
            result.style.border = '1px solid rgba(16,185,129,0.3)';
            result.style.color = '#34D399';
            result.innerHTML = `✅ ¡${count} prevencionistas cargados exitosamente a Firebase!`;
            btn.innerHTML = '✅ Completado';
            btn.style.background = '#059669';

        } catch (error) {
            result.style.background = 'rgba(239,68,68,0.1)';
            result.style.border = '1px solid rgba(239,68,68,0.3)';
            result.style.color = '#FCA5A5';
            result.innerHTML = `❌ Error: ${error.message}`;
            btn.disabled = false;
            btn.innerHTML = 'Reintentar';
        }
    });
};
