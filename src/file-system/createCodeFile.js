const { v4: getUUID } = require("uuid");
const { existsSync, mkdirSync, writeFileSync } = require("fs");
const { join } = require("path");

const CODES_DIR = process.env.CODES_DIR || "/tmp/codes";
const OUTPUTS_DIR = process.env.OUTPUTS_DIR || "/tmp/outputs";

if (!existsSync(CODES_DIR)) mkdirSync(CODES_DIR, { recursive: true });
if (!existsSync(OUTPUTS_DIR)) mkdirSync(OUTPUTS_DIR, { recursive: true });

const createCodeFile = async (language, code) => {
    console.log(code, language);
    let jobID = getUUID();
    jobID = jobID.replace(/-/g, "");
    console.log(jobID);
    const fileName = language === "java" ? `Main${jobID}.${language}` : `${jobID}.${language}`;
    console.log(fileName)
    const filePath = join(CODES_DIR, fileName);
    console.log(filePath)
    if (language === "java") {
        code = code.replace("Main", "Main" + jobID);
        jobID = "Main" + jobID;
    }
    console.log(code);
    console.log(filePath);
    console.log(jobID);
    console.log(fileName);
    
    await writeFileSync(filePath, code?.toString());

    return {
        fileName,
        filePath,
        jobID,
    };
};

module.exports = {
    createCodeFile,
};
