import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./js/services/firebase-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCerts() {
  const q = query(collection(db, "certificates"));
  const snapshot = await getDocs(q);
  console.log("Total certificates:", snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
}

checkCerts();
