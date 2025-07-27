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
    console.log(`🔨 Starting compilation for ${language}...`);
    const compileStartTime = Date.now();
    
    try {
      await new Promise((resolve, reject) => {
        const compileProcess = spawn(compileCodeCommand, compilationArgs || []);
        let compileError = "";

        compileProcess.stderr.on("data", (data) => {
          compileError += data.toString();
        });

        compileProcess.on("exit", (code) => {
          const compileEndTime = Date.now();
          const compileDuration = compileEndTime - compileStartTime;
          
          if (code !== 0 || compileError.trim()) {
            console.log(`❌ Compilation failed in ${compileDuration}ms with exit code ${code}`);
            reject({
              status: 200,
              output: "",
              error: compileError.trim(),
              language,
            });
          } else {
            console.log(`✅ Compilation successful in ${compileDuration}ms`);
            resolve();
          }
        });

        compileProcess.on("error", (err) => {
          const compileEndTime = Date.now();
          const compileDuration = compileEndTime - compileStartTime;
          console.log(`💥 Compilation error in ${compileDuration}ms: ${err.message}`);
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

  // Helper function to execute a single test case
  const executeTestCase = async (testcaseInput, testcaseIndex) => {
    console.log(`🏃 Testcase ${testcaseIndex + 1} execution starting...`);
    let maxMemory = 0;

    try {
      const result = await new Promise((resolve, reject) => {
        console.log(`🔧 Spawning process for testcase ${testcaseIndex + 1}`);
        const executeCode = spawn(executeCodeCommand, executionArgs || []);
        let output = "";
        let error = "";
        let localErrorCode = 0;

        const start = process.hrtime.bigint();

        const timer = setTimeout(() => {
          executeCode.kill("SIGHUP");
          clearInterval(memoryInterval);
          console.log(`⏰ Testcase ${testcaseIndex + 1} timed out after ${TIMEOUT_MS / 1000}s`);
          reject({
            status: 408,
            testcaseIndex,
            error: `Timeout: Testcase ${testcaseIndex + 1} exceeded ${TIMEOUT_MS / 1000}s`,
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
          
          console.log(`⏱️  Testcase ${testcaseIndex + 1} completed in ${durationMs.toFixed(2)}ms with exit code ${code}`);

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
            index: testcaseIndex,
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
          console.log(`❌ Testcase ${testcaseIndex + 1} failed with error: ${err.message}`);
          reject({
            status: 500,
            testcaseIndex,
            error: `Execution failed: ${err.message}`,
          });
        });
      });

      return result;

    } catch (executionError) {
      console.log(`💥 Testcase ${testcaseIndex + 1} caught execution error:`, executionError.error || "Runtime Error");
      return {
        index: testcaseIndex,
        input: testcaseInput,
        output: executionError.error || "Runtime Error",
        error: executionError.error || "Runtime Error",
        durationMs: TIMEOUT_MS,
        memoryBytes: maxMemory,
        exitCode: -1,
        errorCode: 2,
      };
    }
  };

  // Execute all test cases in parallel
  console.log(`🚀 Starting ${allTestcaseInputs.length} test cases in parallel...`);
  const startTime = Date.now();
  
  const testCasePromises = allTestcaseInputs.map((testcaseInput, index) => {
    console.log(`📝 Testcase ${index + 1} started at ${new Date().toISOString()}`);
    return executeTestCase(testcaseInput, index);
  });

  const results = await Promise.all(testCasePromises);
  const totalTime = Date.now() - startTime;
  console.log(`✅ All ${allTestcaseInputs.length} test cases completed in ${totalTime}ms`);

  // Sort results by index to maintain original order
  results.sort((a, b) => a.index - b.index);

  // Determine overall error code and error index
  for (const result of results) {
    if (result.errorCode !== 0) {
      errorCode = result.errorCode;
      if (errorIndex === -1) {
        errorIndex = result.index;
      }
    }
  }

  // === Cleanup ===
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
