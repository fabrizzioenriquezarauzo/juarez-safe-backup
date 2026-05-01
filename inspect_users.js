const https = require('https');
const url = 'https://firestore.googleapis.com/v1/projects/ja-safework/databases/(default)/documents/users?pageSize=100';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const body = JSON.parse(data);
            if (!body.documents) {
                console.log('No documents found in response');
                return;
            }
            body.documents.forEach(doc => {
                const fields = doc.fields || {};
                const name = fields.name ? fields.name.stringValue : 'No Name';
                const status = fields.validationStatus ? fields.validationStatus.stringValue : 'No Status';
                const docs = fields.documentation ? fields.documentation.mapValue.fields : null;
                
                // Inspect everyone to see what's getting through
                console.log('--- User:', name, '| Status:', status, '---');
                if (docs) {
                    Object.keys(docs).forEach(k => {
                        const val = docs[k].stringValue || 'OTHER_TYPE';
                        console.log('  Doc:', k, '=', val);
                    });
                } else {
                    console.log('  No documentation field');
                }
            });
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });
}).on('error', (e) => {
    console.error('Network error:', e.message);
});
