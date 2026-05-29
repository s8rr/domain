const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BANNED_WORDS = ['admin', 'api', 'root', 'support', 'government', 'govt', 'bkash', 'nagad', 'bank', 'www', 'mail', 'dns'];

function getChangedFiles() {
    try {
        // Fetches names of files altered in the GitHub Pull Request
        const output = execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf8' });
        return output.split('\n').filter(Boolean);
    } catch (e) {
        console.log("Running locally or couldn't fetch git diff. Validating all files instead.");
        return fs.readdirSync(path.join(__dirname, '../domains')).map(f => `domains/${f}`);
    }
}

function validate() {
    const changedFiles = getChangedFiles();
    const githubActor = process.env.GITHUB_ACTOR ? process.env.GITHUB_ACTOR.toLowerCase() : null;

    changedFiles.forEach(file => {
        // Skip files that aren't inside the domains directory or are just the example template
        if (!file.startsWith('domains/') || file === 'domains/example.json') return;
        if (!file.endsWith('.json')) {
            console.error(`❌ Error: Only JSON configuration files are allowed inside the domains folder. Look at: ${file}`);
            process.exit(1);
        }

        const filename = path.parse(file).name.toLowerCase();
        
        // 1. Check for alphanumeric, lowercase, dash, underscore, and dot domain limits
        if (!/^[a-z0-9_.-]+$/.test(filename)) {
            console.error(`❌ Error: Filename "${filename}" must contain only lowercase letters, numbers, dashes, underscores, and dots.`);
            process.exit(1);
        }

        // 2. Prevent system keyword hijacking
        if (BANNED_WORDS.includes(filename)) {
            console.error(`❌ Error: The subdomain name "${filename}" is reserved and cannot be registered.`);
            process.exit(1);
        }

        // 3. Read and parse JSON content safety validation
        let data;
        try {
            data = JSON.parse(fs.readFileSync(path.join(__dirname, '../', file), 'utf8'));
        } catch (e) {
            console.error(`❌ Error: File ${file} is not a valid JSON object.`);
            process.exit(1);
        }

        // 4. Enforce structural schema verification
        if (!data.owner || !data.owner.username || !data.records) {
            console.error(`❌ Error: ${file} is missing required schema components (owner.username, records).`);
            process.exit(1);
        }

        // 5. Ownership Guardrail: Ensure users only register/edit names matching their GitHub account
        if (githubActor && data.owner.username.toLowerCase() !== githubActor) {
            // Exceptional safety condition: Block malicious takeovers
            if (filename !== githubActor) {
                console.error(`❌ Security Violation: GitHub user "${githubActor}" is attempting to modify or create a record for a username that doesn't belong to them.`);
                process.exit(1);
            }
        }
    });

    console.log("✅ Awesome! All domain files passed structural safety and structural linter checks.");
}

validate();
