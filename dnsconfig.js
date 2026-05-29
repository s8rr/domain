// Initialize Registrars and Providers
var REG_NONE = NewRegistrar('none');
var DSP_CLOUDFLARE = NewDnsProvider('cloudflare');

// Fetch all domain configuration files natively using DNSControl's glob matcher
var domainFiles = glob.glob('domains', '*.json');
var parsedDomains = [];

// Parse each JSON file safely using native engine methods
for (var i = 0; i < domainFiles.length; i++) {
    var filePath = domainFiles[i];
    
    // Skip the example file template
    if (filePath.indexOf('example.json') !== -1) {
        continue;
    }

    // Read and parse file content natively
    var contentStr = readfile(filePath);
    var content = JSON.parse(contentStr);
    
    // Extract subdomain name from the file name string
    var parts = filePath.split('/');
    var fileName = parts[parts.length - 1];
    var subdomain = fileName.replace('.json', '').toLowerCase();

    parsedDomains.push({
        subdomain: subdomain,
        records: content.records
    });
}

// Configuration for your Master Apex Domain
D('code-space.me', REG_NONE, DnsProvider(DSP_CLOUDFLARE),
    A('@', '192.0.2.1'),     // Your personal landing page IP
    CNAME('www', '@'),       // Point www to apex

    // Inject user records using the parsed data array
    parsedDomains.map(function(d) {
        var subdomain = d.subdomain;
        var records = d.records;
        var commands = [];

        if (records.CNAME) {
            commands.push(CNAME(subdomain, records.CNAME));
        }
        if (records.A) {
            if (Array.isArray(records.A)) {
                records.A.forEach(function(ip) {
                    commands.push(A(subdomain, ip));
                });
            } else {
                commands.push(A(subdomain, records.A));
            }
        }
        return commands;
    })
);
