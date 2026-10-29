const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BANNED_WORDS = ['admin', 'api', 'root', 'support', 'government', 'govt', 'bkash', 'nagad', 'bank', 'www', 'mail', 'dns'];

// Reserved DNS label prefixes. These belong inside a TXT record's "name"
// field (e.g. { "name": "_vercel", "value": "..." }), never in the filename
// itself — the filename must always be just the plain subdomain.
const RESERVED_PREFIXES = ['_vercel', '_acme-challenge', '_dmarc', '_domainkey', '_dkim', '_github-pages-challenge'];

function showErrorAndExit(message) {
    console.error(message);
    process.exit(1);
}

let validatingAll = false;

function getChangedFiles() {
    try {
        // Only look at Added, Copied, Modified, or Renamed files. We handle deletions later.
        const output = execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf8' });
        return output.split('\n').map(s => s.trim()).filter(Boolean);
    } catch (e) {
        console.log("Running locally or couldn't fetch git diff. Validating all files instead.");
        
        validatingAll = true;

        const { globSync } = require('glob');

        return globSync('domains/**/*.json').map(p => p.replace(/\\/g, '/'));

    }
}


function validate() {

    const changedFiles = getChangedFiles();

    const githubActor = (process.env.PR_AUTHOR || process.env.GITHUB_ACTOR) ? (process.env.PR_AUTHOR || process.env.GITHUB_ACTOR).toLowerCase() : null;
    
    let prLabels = [];
    try {
        if (process.env.PR_LABELS) {
            prLabels = JSON.parse(process.env.PR_LABELS).map(l => l.toLowerCase());
        }
    } catch (e) {}
    
    const isMaintainer = githubActor === 's8rr' || prLabels.includes('bypass');

    changedFiles.forEach(file => {

        if (!file.startsWith('domains/') || file === 'domains/example.json') return;

        console.log(`🔍 Validating: ${file}`);

        if (!file.endsWith('.json')) {
            showErrorAndExit(`❌ Error: Only JSON configuration files are allowed inside the domains folder. Look at: \`${file}\``);
        }

        const filename = path.basename(file, '.json').toLowerCase();


        // 1a. Validate valid characters in filename
        if (!/^[a-z0-9\-\_\.]+$/.test(filename)) {
            showErrorAndExit(`❌ Error: Filename \`${filename}\` must contain only lowercase letters, numbers, dashes, underscores, and dots.`);
        }

        // 1b. Block reserved DNS label prefixes from being used as the filename/subdomain.
        // GitHub usernames can never contain an underscore, so a filename whose first
        // label is one of these can never legitimately "match your GitHub username" —
        // it's almost always a mistake where the prefix belongs in a TXT record's
        // "name" field instead.

        const firstLabel = filename.split('.')[0];

        if (RESERVED_PREFIXES.includes(firstLabel)) {
            const suggested = filename.split('.').slice(1).join('.') || '<your-username>';
            showErrorAndExit(`❌ Error: Filename \`${filename}.json\` cannot start with the reserved prefix "${firstLabel}". This prefix belongs in your TXT record's "name" field instead, e.g.:\n\n  "TXT": { "name": "${firstLabel}", "value": "..." }\n\nRename your file to \`${suggested}.json\`.`);
        }

        // 2. Prevent system keyword hijacking

        if (BANNED_WORDS.includes(filename)) {
            showErrorAndExit(`❌ Error: The subdomain name \`${filename}\` is reserved and cannot be registered.`);
        }

        // 3. Fetch original file data (if it exists on main) to check for hijacking/stealing

        let oldData = null;
        let isNewFile = true;

        if (!validatingAll) {
            try {
                // If this succeeds, the file already existed on main branch before this PR
                const oldContent = execSync(`git show origin/main:${file}`, { encoding: 'utf8' });
                oldData = JSON.parse(oldContent);
                isNewFile = false;
            } catch (e) {
                // File doesn't exist on main, so it's a brand new domain registration
                isNewFile = true;
            }
        }

        // Check if file is being deleted in this PR
        const fileExists = fs.existsSync(file);

        if (!fileExists) {
            if (githubActor && !validatingAll && !isNewFile && oldData && oldData.owner && !isMaintainer) {
                if (oldData.owner.username.toLowerCase() !== githubActor) {
                    showErrorAndExit(`❌ Security Violation: You ("${githubActor}") cannot delete \`${file}\` because it is owned by "${oldData.owner.username}".`);
                }
            }
            return; // File is safely deleted and validation passed, move to next file
        }

        // Read current file content in the PR
        let data;
        try {
            const content = fs.readFileSync(file, 'utf8');
            data = JSON.parse(content);
        } catch (e) {
            showErrorAndExit(`❌ Error: File \`${file}\` is not a valid JSON object.`);
        }

        // 4. Enforce structural schema verification
        if (!data.owner || !data.owner.username || !data.records) {
            showErrorAndExit(`❌ Error: \`${file}\` is missing required schema components (owner.username, records).`);
        }

        // 5. Strict Ownership Guardrail
        if (githubActor && !validatingAll && !isMaintainer) {
            if (isNewFile) {
                // NEW FILE: Ensure the person creating it matches the owner.username
                if (data.owner.username.toLowerCase() !== githubActor) {
                    showErrorAndExit(`❌ Security Violation: You are creating a new domain, but 'owner.username' ("${data.owner.username}") does not match your GitHub username ("${githubActor}"). Did you copy the example file and forget to update it?`);
                }
            } else {
                // EXISTING FILE: Check against the ORIGINAL data from main to prevent stealing
                if (oldData && oldData.owner && oldData.owner.username) {
                    if (oldData.owner.username.toLowerCase() !== githubActor) {
                        showErrorAndExit(`❌ Security Violation: You ("${githubActor}") cannot modify \`${file}\` because it is originally owned by "${oldData.owner.username}".`);
                    }
                }
            }
        }
    });

    console.log('✅ Awesome! All domain files passed structural safety checks.');
}

validate();
