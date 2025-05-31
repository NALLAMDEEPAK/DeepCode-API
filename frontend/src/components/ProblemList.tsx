import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Problem } from '../types';

export function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([]);

  useEffect(() => {
    axios.get('http://localhost:3000/problems')
      .then(response => setProblems(response.data))
      .catch(error => console.error('Error fetching problems:', error));
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-xl font-semibold">Problems</h2>
      </div>
      <ul className="divide-y divide-gray-200">
        {problems.map(problem => (
          <li key={problem.id} className="px-4 py-4 hover:bg-gray-50">
            <Link to={`/problem/${problem.id}`} className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{problem.title}</h3>
                <p className="text-sm text-gray-500">{problem.difficulty}</p>
              </div>
              <span className="text-gray-400">&rarr;</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}