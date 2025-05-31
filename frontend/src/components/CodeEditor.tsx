import { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { ExecutionResult, Problem, TestCase } from '../types';

interface CodeEditorProps {
  problem: Problem;
}

export function CodeEditor({ problem }: CodeEditorProps) {
  const [language, setLanguage] = useState<string>('js');
  const [code, setCode] = useState<string>(problem.starterCode[language] || '');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const runCode = async () => {
    setIsRunning(true);
    try {
      const response = await axios.post<ExecutionResult>('http://localhost:3000/execute', {
        code,
        language,
        input: problem.examples[0].input
      });
      
      setOutput(response.data.error || response.data.output);
    } catch (error) {
      setOutput('Error executing code');
    }
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4">
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setCode(problem.starterCode[e.target.value] || '');
          }}
          className="rounded-md border-gray-300"
        >
          <option value="js">JavaScript</option>
          <option value="py">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
        <button
          onClick={runCode}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded-md disabled:bg-gray-400"
        >
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>
      
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            automaticLayout: true,
          }}
        />
      </div>
      
      <div className="mt-4 bg-gray-800 text-white p-4 rounded-md h-32 overflow-auto">
        <pre>{output}</pre>
      </div>
    </div>
  );
}