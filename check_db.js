const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8081');
    const dates = await page.evaluate(async () => {
        const db = await import('./js/services/database.js?v=' + Date.now());
        const users = await db.getProfessionals();
        const alejandra = users.find(u => u.name.includes("Alejandra"));
        if (!alejandra) return "Alejandra no encontrada";
        
        return await db.getProfessionalOccupiedDates(alejandra.id);
    });
    console.log("Fechas ocupadas de Alejandra:", dates);
    await browser.close();
})();
