import { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { CodeExecutionResponse } from '../types';

interface Props {
  problemId: string;
  starterCode: string;
  language: string;
  testCases: { input: string; expectedOutput: string; }[];
}

export default function CodeEditor({ problemId, starterCode, language, testCases }: Props) {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState<CodeExecutionResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async (isTest: boolean = false) => {
    setIsRunning(true);
    try {
      const response = await axios.post('http://localhost:3000/execute', {
        code,
        language,
        input: isTest ? testCases[0].input : ''
      });
      setOutput(response.data);
    } catch (error) {
      console.error('Error executing code:', error);
    }
    setIsRunning(false);
  };

  return (
    <div className="h-full flex flex-col">
      <Editor
        height="70vh"
        defaultLanguage={language}
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
        }}
      />
      <div className="flex gap-2 my-4">
        <button
          onClick={() => runCode(false)}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Run Code
        </button>
        <button
          onClick={() => runCode(true)}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test
        </button>
      </div>
      {output && (
        <div className="bg-gray-800 text-white p-4 rounded">
          <h3 className="font-bold mb-2">Output:</h3>
          <pre className="whitespace-pre-wrap">{output.error || output.output}</pre>
        </div>
      )}
    </div>
  );
}