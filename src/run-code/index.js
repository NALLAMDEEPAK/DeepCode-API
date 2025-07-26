const { commandMap, supportedLanguages } = require("./instructions");
const { createCodeFile } = require("../file-system/createCodeFile");
const { removeCodeFile } = require("../file-system/removeCodeFile");
const { info } = require("./info");

const { spawn } = require("child_process");
const pidusage = require("pidusage");

const TIMEOUT_MS = 5000;

async function runCode({ language = "", code = "", input = "", inputLine = 1 }) {
  if (!code) {
    throw { status: 400, error: "No Code found to execute." };
  }

  if (!supportedLanguages.includes(language)) {
    throw {
      status: 400,
      error: `Invalid language. Supported languages: ${supportedLanguages.join(", ")}.`,
    };
  }

  const { jobID } = await createCodeFile(language, code);
  const {
    compileCodeCommand,
    compilationArgs,
    executeCodeCommand,
    executionArgs,
    outputExt,
  } = commandMap(jobID, language);

  let errorCode = 0;
  let errorIndex = -1;

  if (compileCodeCommand) {
    try {
      await new Promise((resolve, reject) => {
        const compileProcess = spawn(compileCodeCommand, compilationArgs || []);
        let compileError = "";

        compileProcess.stderr.on("data", (data) => {
          compileError += data.toString();
        });

        compileProcess.on("exit", (code) => {
          if (code !== 0 || compileError.trim()) {
            reject({
              status: 200,
              output: "",
              error: compileError.trim(),
              language,
            });
          } else {
            resolve();
          }
        });

        compileProcess.on("error", (err) => {
          reject({
            status: 500,
            output: "",
            error: `Failed to compile: ${err.message}`,
            language,
          });
        });
      });
    } catch (compileResult) {
      errorCode = 1;
      await removeCodeFile(jobID, language, outputExt);
      return {
        language,
        info: await info(language),
        outputs: compileResult.error,
        maxTestcaseTimeMs: 0,
        maxMemoryUsageBytes: 0,
        errorCode,
        index: errorIndex,
      };
    }
  }

  const inputLines = input.trim().split("\n");
  const testcaseCount = parseInt(inputLines[0], 10);
  const allTestcaseInputs = [];

  let cursor = 1;
  for (let i = 0; i < testcaseCount; i++) {
    const linesForThisTestcase = [1];
    for (let j = 0; j < inputLine && cursor < inputLines.length; j++) {
      linesForThisTestcase.push(inputLines[cursor++]);
    }
    allTestcaseInputs.push(linesForThisTestcase.join("\n"));
  }

  const testcasePromises = allTestcaseInputs.map((testcaseInput, i) => {
    return (async () => {
      let maxMemory = 0;

      try {
        const result = await new Promise((resolve, reject) => {
          const executeCode = spawn(executeCodeCommand, executionArgs || []);
          let output = "";
          let error = "";
          let localErrorCode = 0;

          const start = process.hrtime.bigint();

          const timer = setTimeout(() => {
            executeCode.kill("SIGHUP");
            clearInterval(memoryInterval);
            reject({
              status: 408,
              testcaseIndex: i,
              error: `Timeout: Testcase ${i + 1} exceeded ${TIMEOUT_MS / 1000}s`,
            });
          }, TIMEOUT_MS);

          const memoryInterval = setInterval(async () => {
            try {
              const stats = await pidusage(executeCode.pid);
              maxMemory = Math.max(maxMemory, stats.memory);
            } catch (_) {}
          }, 50);

          executeCode.stdin.write(testcaseInput);
          executeCode.stdin.end();

          executeCode.stdout.on("data", (data) => {
            output += data.toString();
          });

          executeCode.stderr.on("data", (data) => {
            error += data.toString();
          });

          executeCode.on("exit", async (code) => {
            clearTimeout(timer);
            clearInterval(memoryInterval);
            const end = process.hrtime.bigint();
            const durationMs = Number(end - start) / 1000000;

            if (!maxMemory) {
              try {
                const stats = await pidusage(executeCode.pid);
                maxMemory = stats.memory;
              } catch (_) {}
            }

            if (error.trim()) {
              localErrorCode = error.trim().startsWith('File "/tmp/codes/') ? 1 : 2;
            }

            resolve({
              index: i,
              input: testcaseInput,
              output: output.trim(),
              error: error.trim(),
              durationMs,
              memoryBytes: maxMemory,
              exitCode: code,
              errorCode: localErrorCode,
            });
          });

          executeCode.on("error", (err) => {
            clearTimeout(timer);
            clearInterval(memoryInterval);
            reject({
              status: 500,
              testcaseIndex: i,
              error: `Execution failed: ${err.message}`,
            });
          });
        });

        return result;

      } catch (executionError) {
        return {
          index: i,
          input: testcaseInput,
          output: executionError.error || "Runtime Error",
          error: executionError.error || "Runtime Error",
          durationMs: TIMEOUT_MS,
          memoryBytes: maxMemory,
          errorCode: 2,
        };
      }
    })();
  });

  const results = await Promise.all(testcasePromises);
  for (const r of results) {
    if (r.errorCode !== 0) {
      errorCode = r.errorCode;
      errorIndex = r.index;
      if (errorCode === 1) break;
    }
  }
  await removeCodeFile(jobID, language, outputExt);

  let res = results
    .map((r) => (r.error ? r.error : r.output))
    .join(":?:")
    .trim();

  if (res.endsWith(":?:")) res = res.slice(0, -3);
  return {
    language,
    info: await info(language),
    outputs: res,
    maxTestcaseTimeMs: Math.max(...results.map((r) => r.durationMs || 0)),
    maxMemoryUsageBytes: Math.max(...results.map((r) => r.memoryBytes || 0)),
    errorCode,
    index: errorIndex,
  };
}

module.exports = { runCode };
