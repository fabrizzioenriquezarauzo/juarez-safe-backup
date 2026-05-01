
import { db } from './js/services/firebase.js';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

async function fixClaudioRecord() {
    const q = query(collection(db, "serviceRequests"), where("professionalName", "==", "Claudio cuya chate"));
    const snapshot = await getDocs(q);
    
    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.totalAmount === 1120 && data.status === 'approved') {
            console.log(`Fixing doc ${docSnap.id}...`);
            await updateDoc(docSnap.ref, {
                totalAmount: 140,
                days: 1,
                adminCommission: 21,
                profEarnings: 119
            });
            console.log("Fixed!");
        }
    }
    process.exit(0);
}

fixClaudioRecord();
