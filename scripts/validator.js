const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BANNED_WORDS = ['admin', 'api', 'root', 'support', 'government', 'govt', 'bkash', 'nagad', 'bank', 'www', 'mail', 'dns'];

// UPDATED: This now prints standard console logs AND formats a GitHub error command
function showErrorAndExit(message, file = null) {
    // 1. Keep standard console.error for the standard log timeline
    console.error(message);
    
    // 2. Format a GitHub workflow annotation command if it runs in CI
    if (process.env.GITHUB_ACTIONS === 'true') {
        if (file) {
            // Strip any raw markdown ticks from message for cleaner GitHub UI presentation
            const cleanMsg = message.replace(/`/g, '');
            console.log(`::error file=${file}::${cleanMsg}`);
        } else {
            console.log(`::error::${message}`);
        }
    }
    
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
        return fs.readdirSync(path.join(__dirname, '../domains')).map(f => `domains/${f}`);
    }
}

function validate() {
    const changedFiles = getChangedFiles();
    const githubActor = process.env.GITHUB_ACTOR ? process.env.GITHUB_ACTOR.toLowerCase() : null;

    changedFiles.forEach(file => {
        if (!file.startsWith('domains/') || file === 'domains/example.json') return;
        if (!file.endsWith('.json')) {
            showErrorAndExit(`❌ Error: Only JSON configuration files are allowed inside the domains folder. Look at: \`${file}\``, file);
        }

        const filename = path.parse(file).name.toLowerCase();

        // 1. Check for alphanumeric, lowercase, dash, underscore, and dot domain limits
        if (!/^[a-z0-9_.-]+$/.test(filename)) {
            showErrorAndExit(`❌ Error: Filename \`${filename}\` must contain only lowercase letters, numbers, dashes, underscores, and dots.`, file);
        }

        // 2. Prevent system keyword hijacking
        if (BANNED_WORDS.includes(filename)) {
            showErrorAndExit(`❌ Error: The subdomain name \`${filename}\` is reserved and cannot be registered.`, file);
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
                    showErrorAndExit(`❌ Security Violation: You ("${githubActor}") cannot delete \`${file}\` because it is owned by "${oldData.owner.username}".`, file);
                }
            }
            return; // File is safely deleted and validation passed, move to next file
        }

        // 3. Read and parse JSON content safety validation
        let data;
        try {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            showErrorAndExit(`❌ Error: File \`${file}\` is not a valid JSON object.`, file);
        }

        // 4. Enforce structural schema verification
        if (!data.owner || !data.owner.username || !data.records) {
            showErrorAndExit(`❌ Error: \`${file}\` is missing required schema components (owner.username, records).`, file);
        }

        // 5. Strict Ownership Guardrail
        if (githubActor && !validatingAll) {
            if (isNewFile) {
                // NEW FILE: Ensure the person creating it matches the owner.username
                if (data.owner.username.toLowerCase() !== githubActor) {
                    showErrorAndExit(`❌ Security Violation: You are creating a new domain, but 'owner.username' ("${data.owner.username}") does not match your GitHub username ("${githubActor}"). Did you copy the example file and forget to update it?`, file);
                }
            } else {
                // EXISTING FILE: Check against the ORIGINAL data from main to prevent stealing
                if (oldData && oldData.owner && oldData.owner.username) {
                    if (oldData.owner.username.toLowerCase() !== githubActor) {
                        showErrorAndExit(`❌ Security Violation: You ("${githubActor}") cannot modify \`${file}\` because it is originally owned by "${oldData.owner.username}".`, file);
                    }
                }
            }
        }
    });

    console.log("✅ Awesome! All domain files passed structural safety checks.");
}

validate();
