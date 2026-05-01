const https = require('https');
https.get('https://firestore.googleapis.com/v1/projects/ja-safework/databases/(default)/documents/users', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        const user = json.documents.find(d => JSON.stringify(d).includes('Chavez Moreno'));
        console.log(JSON.stringify(user?.fields, null, 2));
    });
});
