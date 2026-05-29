// Initialize Registrars and Providers
var REG_NONE = NewRegistrar('none');
var DSP_CLOUDFLARE = NewDnsProvider('cloudflare');

// 🌐 Core Configuration for code-space Domain
D('code-space.me', REG_NONE, DnsProvider(DSP_CLOUDFLARE),
    // Main website root routing (Points directly to GitHub Pages servers)
    A('@', '185.199.108.153'),
    A('@', '185.199.109.153'),
    A('@', '185.199.110.153'),
    A('@', '185.199.111.153'),
    
    // Points www.code-space.me to your GitHub profile link
    CNAME('www', 's8rr.github.io.')
);

// 📂 Dynamic Subdomain Registry Compiler Loader
try {
    // DNSControl native asset loader context
    var parsedDomains = require('./dist-domains.json');
    
    for (var i = 0; i < parsedDomains.length; i++) {
        var item = parsedDomains[i];
        var subdomain = item.subdomain;
        var records = item.records;

        if (records && records.CNAME) {
            // Deploy records safely with Cloudflare proxy bypassed for custom web setups
            D('code-space.me', REG_NONE, DnsProvider(DSP_CLOUDFLARE),
                CNAME(subdomain, records.CNAME, CF_PROXY_OFF)
            );
        }
        
        if (records && records.A) {
            if (typeof records.A === 'string') {
                D('code-space.me', REG_NONE, DnsProvider(DSP_CLOUDFLARE),
                    A(subdomain, records.A, CF_PROXY_OFF)
                );
            } else if (Array.isArray(records.A)) {
                for (var j = 0; j < records.A.length; j++) {
                    D('code-space.me', REG_NONE, DnsProvider(DSP_CLOUDFLARE),
                        A(subdomain, records.A[j], CF_PROXY_OFF)
                    );
                }
            }
        }
    }
} catch (e) {
    // Fallback block to prevent the pipeline from breaking if no user files exist yet
}
