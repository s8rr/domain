// Initialize Providers
var REG_NONE = NewRegistrar('none');
var DSP_CLOUDFLARE = NewDnsProvider('cloudflare');

// 1. Core Default Records
var totalRecords = [
    A('@', '185.199.108.153'),
    A('@', '185.199.109.153'),
    A('@', '185.199.110.153'),
    A('@', '185.199.111.153'),
    CNAME('www', 's8rr.github.io.')
];

// 2. Safely load the generated flat database index
try {
    var parsedDomains = require('./dist-domains.json');
    
    for (var i = 0; i < parsedDomains.length; i++) {
        var item = parsedDomains[i];
        var subdomain = item.subdomain;
        var records = item.records;

        if (records && records.CNAME) {
            // Sanitize the CNAME target to ensure it ends with a trailing dot
            var target = records.CNAME.trim();
            if (!target.endsWith('.')) {
                target = target + '.';
            }
            
            totalRecords.push(CNAME(subdomain, target, CF_PROXY_OFF));
        }
        
        if (records && records.A) {
            if (typeof records.A === 'string') {
                totalRecords.push(A(subdomain, records.A, CF_PROXY_OFF));
            } else if (Array.isArray(records.A)) {
                for (var j = 0; j < records.A.length; j++) {
                    totalRecords.push(A(subdomain, records.A[j], CF_PROXY_OFF));
                }
            }
        }
    }
} catch (e) {
    // If file isn't created yet or syntax error occurs, fall back quietly
}

// 3. One Master Declaration (This guarantees records aren't dropped or wiped)
D('code-space.me', REG_NONE, DnsProvider(DSP_CLOUDFLARE), totalRecords);
