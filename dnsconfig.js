// Initialize Providers
var REG_NONE = NewRegistrar('none');
var DSP_CLOUDFLARE = NewDnsProvider('cloudflare');

var parsedDomains = {};

// 1. Safely load the generated multi-domain database index
try {
    parsedDomains = require('./dist-domains.json');
} catch (e) {
    // Fail quietly if background compile file is missing
}

// Defining our scope of active managed apex domains
var targetDomains = ['akjon.dev', 'code-space.me', 'id-card.me'];

// Loop through each domain to build records and issue separate zone declarations
for (var k = 0; k < targetDomains.length; k++) {
    var domain = targetDomains[k];
    var totalRecords = [];

    // Apply Core Default Records exclusively to code-space.me
    if (domain === 'code-space.me') {
        totalRecords.push(CNAME('www', 'code-space.me.'));
        
        // IGNORE manually configured Cloudflare Worker routes
        totalRecords.push(IGNORE('code-space.me', 'WORKER'));
        totalRecords.push(IGNORE('docs.code-space.me', 'WORKER'));
    }

    var items = parsedDomains[domain];
    if (items && Array.isArray(items)) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var subdomain = item.subdomain;
            var records = item.records;

            if (!records) continue;

            // ─── A RECORDS ───────────────────────────────────────────────────
            if (records.A) {
                var aData = Array.isArray(records.A) ? records.A : [records.A];
                for (var j = 0; j < aData.length; j++) {
                    totalRecords.push(A(subdomain, aData[j], CF_PROXY_OFF));
                }
            }

            // ─── AAAA RECORDS ─────────────────────────────────────────────────
            if (records.AAAA) {
                var aaaaData = Array.isArray(records.AAAA) ? records.AAAA : [records.AAAA];
                for (var j = 0; j < aaaaData.length; j++) {
                    totalRecords.push(AAAA(subdomain, aaaaData[j], CF_PROXY_OFF));
                }
            }

            // ─── CNAME RECORDS ────────────────────────────────────────────────
            if (records.CNAME) {
                var target = records.CNAME.trim();
                if (!target.endsWith('.')) target += '.';
                totalRecords.push(CNAME(subdomain, target, CF_PROXY_OFF));
            }

            // ─── TXT RECORDS ──────────────────────────────────────────────────
            // Supports two shapes per entry:
            //   1. A plain string  -> attached at the root of the user's subdomain
            //      "TXT": "v=spf1 -all"
            //   2. An object with a "name" -> attached under that name, scoped to
            //      the user's subdomain by default (only the FIRST label of
            //      "name" is used, e.g. "_vercel.something" becomes just "_vercel")
            //      "TXT": { "name": "_vercel", "value": "vc-domain-verify=..." }
            //   Set "useFullName": true on the object to use "name" exactly as
            //   written instead of truncating it to its first label + subdomain.
            if (records.TXT) {
                var txtData = Array.isArray(records.TXT) ? records.TXT : [records.TXT];
                for (var j = 0; j < txtData.length; j++) {
                    var txtEntry = txtData[j];
                    var txtName = subdomain;
                    var txtValue = txtEntry;

                    if (typeof txtEntry === 'object' && txtEntry !== null && !Array.isArray(txtEntry)) {
                        txtValue = txtEntry.value;

                        if (txtEntry.name) {
                            if (txtEntry.useFullName) {
                                // Toggle: trust the user's literal name as-is
                                txtName = txtEntry.name;
                            } else {
                                // Default: only the first label, scoped under the user's subdomain
                                var firstLabel = txtEntry.name.split('.')[0];
                                txtName = firstLabel + '.' + subdomain;
                            }
                        }
                    }

                    totalRecords.push(TXT(txtName, txtValue));
                }
            }

            // ─── MX RECORDS ───────────────────────────────────────────────────
            if (records.MX) {
                // Expected JSON: "MX": [ [10, "mail.example.com"], [20, "mail2.example.com"] ]
                if (Array.isArray(records.MX)) {
                    for (var j = 0; j < records.MX.length; j++) {
                        var mxRow = records.MX[j];
                        var priority = mxRow[0];
                        var server = mxRow[1].trim();
                        if (!server.endsWith('.')) server += '.';
                        totalRecords.push(MX(subdomain, priority, server));
                    }
                }
            }

            // ─── CAA RECORDS ──────────────────────────────────────────────────
            if (records.CAA) {
                // Expected JSON: "CAA": [ [0, "issue", "letsencrypt.org"] ]
                if (Array.isArray(records.CAA)) {
                    for (var j = 0; j < records.CAA.length; j++) {
                        var caaRow = records.CAA[j];
                        totalRecords.push(CAA(subdomain, caaRow[0], caaRow[1], caaRow[2]));
                    }
                }
            }

            // ─── SRV RECORDS ──────────────────────────────────────────────────
            if (records.SRV) {
                // Expected JSON: "SRV": [ [10, 50, 8080, "server.com"] ]
                if (Array.isArray(records.SRV)) {
                    for (var j = 0; j < records.SRV.length; j++) {
                        var srvRow = records.SRV[j];
                        var targetSrv = srvRow[3].trim();
                        if (!targetSrv.endsWith('.')) targetSrv += '.';
                        totalRecords.push(SRV(subdomain, srvRow[0], srvRow[1], srvRow[2], targetSrv));
                    }
                }
            }

            // ─── URL REDIRECTS (Custom Cloudflare Feature) ────────────────────
            if (records.URL) {
                // 1. Create a dummy record with Cloudflare Proxy turned ON so traffic hits the edge proxy
                totalRecords.push(A(subdomain, '192.0.2.1', CF_PROXY_ON));
                
                // 2. Attach the dynamic Single Redirect mapping instruction rule
                var destinationUrl = records.URL.trim();
                var fullHostname = subdomain + '.' + domain;
                
                totalRecords.push(CF_SINGLE_REDIRECT(
                    'Redirect rule for ' + fullHostname,
                    301,
                    'http.host eq "' + fullHostname + '"',
                    '"' + destinationUrl + '"'
                ));
            }
            
            // ─── NS DELEGATION RECORDS ────────────────────────────────────────
            if (records.NS) {
                // Expected JSON: "NS": ["ns1.cloudflare.com", "ns2.cloudflare.com"]
                var nsData = Array.isArray(records.NS) ? records.NS : [records.NS];
                for (var j = 0; j < nsData.length; j++) {
                    var nameServer = nsData[j].trim();
                    if (!nameServer.endsWith('.')) nameServer += '.';
                    totalRecords.push(NS(subdomain, nameServer));
                }
            }
        }
    }

    // 3. Master Domain Declaration per zone iteration loop
    D(domain, REG_NONE, DnsProvider(DSP_CLOUDFLARE), totalRecords);
}
