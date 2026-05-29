// util/get-pr-files.js
const { execSync } = require("child_process");
const fs = require("fs");

try {
    // 1. Get the list of modified/added files
    const changedFilesRaw = execSync("git diff --name-only origin/main...HEAD")
        .toString()
        .trim()
        .split("\n")
        .filter(Boolean);

    // 2. Find which files were actually deleted or modified
    // We fetch the full diff text specifically for the domains folder
    const diffRaw = execSync("git diff origin/main...HEAD -- domains/")
        .toString();

    const deletedFiles = [];
    
    // Split the raw diff by file markers
    const fileDiffs = diffRaw.split("diff --git ");
    
    for (const fileDiff of fileDiffs) {
        if (!fileDiff.trim()) continue;
        
        // Extract the filename from the diff header
        const lines = fileDiff.split("\n");
        const header = lines[0]; // e.g., "a/domains/test.json b/domains/test.json"
        const match = header.match(/a\/(domains\/.*?\.json)/);
        
        if (match) {
            const fileName = match[1];
            // Grab only the lines that were removed (starting with '-')
            // excluding the '---' file header line
            const deletedLines = lines.filter(line => line.startsWith("-") && !line.startsWith("---"));
            
            deletedFiles.push({
                name: fileName,
                data: deletedLines.join("\n")
            });
        }
    }

    // 3. Write these out to a temporary environment file for GitHub Actions
    // or export them so the environment can read them
    const envFile = process.env.GITHUB_ENV;
    if (envFile) {
        fs.appendFileSync(envFile, `CHANGED_FILES=${JSON.stringify(JSON.stringify(changedFilesRaw))}\n`);
        fs.appendFileSync(envFile, `DELETED_FILES=${JSON.stringify(JSON.stringify(deletedFiles))}\n`);
        console.log("✅ Successfully populated PR file metadata for validation tests.");
    } else {
        console.log("Not running in GitHub Actions environment. Outputting sample data:");
        console.log("CHANGED:", changedFilesRaw);
        console.log("DELETED COUNT:", deletedFiles.length);
    }
} catch (error) {
    console.error("Failed to parse git diff data:", error.message);
    process.exit(1);
}
