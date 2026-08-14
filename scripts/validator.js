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


    changedFiles.forEach(file => {

        if (!file.startsWith('domains/') || file === 'domains/example.json') return;

        if (!file.endsWith('.json')) {

            showErrorAndExit(`❌ Error: Only JSON configuration files are allowed inside the domains folder. Look at: \`${file}\``);

        }


        const filename = path.parse(file).name.toLowerCase();


        // 1. Check for alphanumeric, lowercase, dash, underscore, and dot domain limits

        if (!/^[a-z0-9_.-]+$/.test(filename)) {

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


        const filePath = path.join(__dirname, '../', file);

        const fileExists = fs.existsSync(filePath);


        // Fetch original file from origin/main to prevent domain hijacking

        let isNewFile = false;

        let oldData = null;

        

        if (!validatingAll) {

            try {

                // Ignore stdio errors so it doesn't clutter CI logs if the file is new

                const oldContent = execSync(`git show origin/main:"${file}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });

                oldData = JSON.parse(oldContent);

            } catch (e) {

                isNewFile = true;

            }

        }


        // Handle file deletion attempt

        if (!fileExists) {

            if (githubActor && !validatingAll && !isNewFile && oldData && oldData.owner) {

                if (oldData.owner.username.toLowerCase() !== githubActor) {

                    showErrorAndExit(`❌ Security Violation: You ("${githubActor}") cannot delete \`${file}\` because it is owned by "${oldData.owner.username}".`);

                }

            }

            return; // File is safely deleted and validation passed, move to next file

        }


        // 3. Read and parse JSON content safety validation

        let data;

        try {

            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        } catch (e) {

            showErrorAndExit(`❌ Error: File \`${file}\` is not a valid JSON object.`);

        }


        // 4. Enforce structural schema verification

        if (!data.owner || !data.owner.username || !data.records) {

            showErrorAndExit(`❌ Error: \`${file}\` is missing required schema components (owner.username, records).`);

        }


        // 5. Strict Ownership Guardrail

        if (githubActor && !validatingAll) {

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


    console.log("✅ Awesome! All domain files passed structural safety checks.");

}


validate();
