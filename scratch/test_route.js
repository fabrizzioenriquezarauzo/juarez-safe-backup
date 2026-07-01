let hash = "#/certificados?verify=CERT-123";
let fullPath = hash.replace('#', '');
let path = fullPath.split('?')[0];
console.log("path:", path);
