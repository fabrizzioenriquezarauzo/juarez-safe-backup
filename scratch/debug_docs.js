const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkUsers() {
  const snapshot = await db.collection('users').where('userType', '==', 'professional').limit(10).get();
  snapshot.forEach(doc => {
    console.log(`ID: ${doc.id}`);
    console.log(`Name: ${doc.data().name}`);
    console.log(`Documentation:`, JSON.stringify(doc.data().documentation || 'None', null, 2));
    console.log(`Top-level fields:`, Object.keys(doc.data()).filter(k => k.includes('Url') || ['dni', 'cv', 'certs', 'altura', 'caliente', 'electrico', 'confinados', 'loto'].includes(k)));
    console.log('-------------------');
  });
}

checkUsers();
