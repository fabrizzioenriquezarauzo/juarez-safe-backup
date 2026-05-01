const https = require('https');
const url = 'https://firestore.googleapis.com/v1/projects/ja-safework/databases/(default)/documents/serviceRequests';
https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        if(!json.documents) {
            console.log('No services found');
            return;
        }
        const testServices = json.documents.filter(d => {
            const str = JSON.stringify(d).toLowerCase();
            return str.includes('prueba') || str.includes('test');
        });
        const ids = testServices.map(d => d.name.split('/').pop());
        console.log("TEST_IDS=" + ids.join(','));
    });
});
