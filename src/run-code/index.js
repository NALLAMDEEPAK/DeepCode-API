const {commandMap, supportedLanguages} = require("./instructions")
const {createCodeFile} = require("../file-system/createCodeFile")
const {removeCodeFile} = require("../file-system/removeCodeFile")
const {info} = require("./info")

const {spawn} = require("child_process");

async function runCode({language = "", code = "", input = ""}) {
  const timeout = 30;

  if (code === "")
    throw {
      status: 400,
            error: "No Code found to execute."
        }

  if (!supportedLanguages.includes(language))
    throw {
      status: 400,
            error: `Please enter a valid language. The languages currently supported are: ${supportedLanguages.join(', ')}.`
        }

    const {jobID} = await createCodeFile(language, code);
    const {compileCodeCommand, compilationArgs, executeCodeCommand, executionArgs, outputExt} = commandMap(jobID, language);

  if (compileCodeCommand) {
    await new Promise((resolve, reject) => {
            const compileCode = spawn(compileCodeCommand, compilationArgs || [])
            compileCode.stderr.on('data', (error) => {
        reject({
          status: 200,
                    output: '',
          error: error.toString(),
                    language
                })
      });
            compileCode.on('exit', () => {
                resolve()
            })
        })
  }

  const result = await new Promise((resolve, reject) => {
    const executeCode = spawn(executeCodeCommand, executionArgs || []);
        let output = "", error = "";

    const timer = setTimeout(async () => {
      executeCode.kill("SIGHUP");

      await removeCodeFile(jobID, language, outputExt);

      reject({
        status: 408,
        error: `DeepCode API Timed Out. Your code took too long to execute, over ${timeout} seconds.`,
        language,
      });
    }, timeout * 1000);

    if (input !== "") {
      executeCode.stdin.write(input);
      executeCode.stdin.end();
    }

    executeCode.stdout.on("data", (data) => {
      output += data.toString();
    });

        executeCode.stderr.on('data', (data) => {
      error += data.toString();
    });

    executeCode.on("exit", (code) => {
      clearTimeout(timer);
      resolve({
        output: output.trim(),
        error: error.trim(),
        exitCode: code,
      });
    });
  });

  await removeCodeFile(jobID, language, outputExt);

  return {
    ...result,
    language,
        info: await info(language)
    }
}

module.exports = {runCode}