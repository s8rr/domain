const fs = require('fs');
const path = require('path');

module.exports = function() {
    const domainsDir = path.join(__dirname, '../domains');
    const files = fs.readdirSync(domainsDir);
    const parsedData = [];

    files.forEach(file => {
        if (file.endsWith('.json') && file !== 'example.json') {
            const filePath = path.join(domainsDir, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const subdomain = path.parse(file).name.toLowerCase();

            parsedData.push({
                subdomain: subdomain,
                records: content.records
            });
        }
    });

    return parsedData;
};
