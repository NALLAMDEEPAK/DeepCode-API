export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: Example[];
  constraints: string[];
  starterCode: {
    [key: string]: string;
  };
  testCases: TestCase[];
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface CodeExecutionResponse {
  output: string;
  error: string;
  language: string;
  timeStamp: number;
  status: number;
}