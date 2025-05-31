import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Problem } from '../types';
import { CodeEditor } from './CodeEditor';

export function ProblemPage() {
  const { id } = useParams();
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    axios.get(`http://localhost:3000/problems/${id}`)
      .then(response => setProblem(response.data))
      .catch(error => console.error('Error fetching problem:', error));
  }, [id]);

  if (!problem) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
        <span className={`inline-block px-2 py-1 rounded text-sm mb-4 ${
          problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
          problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {problem.difficulty}
        </span>
        <div className="prose max-w-none">
          <p className="mb-4">{problem.description}</p>
          <h3 className="text-lg font-semibold mb-2">Examples:</h3>
          {problem.examples.map((example, index) => (
            <div key={index} className="mb-4 bg-gray-50 p-4 rounded-md">
              <p><strong>Input:</strong> {example.input}</p>
              <p><strong>Output:</strong> {example.output}</p>
              {example.explanation && (
                <p><strong>Explanation:</strong> {example.explanation}</p>
              )}
            </div>
          ))}
          <h3 className="text-lg font-semibold mb-2">Constraints:</h3>
          <ul className="list-disc pl-5">
            {problem.constraints.map((constraint, index) => (
              <li key={index}>{constraint}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <CodeEditor problem={problem} />
      </div>
    </div>
  );
}