import { Injectable } from '@nestjs/common';
import { Problem } from './interfaces/problem.interface';

@Injectable()
export class ProblemsService {
  private readonly problems: Problem[] = [
    {
      id: '1',
      title: 'Two Sum',
      difficulty: 'Easy',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
        }
      ],
      constraints: [
        '2 <= nums.length <= 104',
        '-109 <= nums[i] <= 109',
        '-109 <= target <= 109'
      ],
      starterCode: {
        python: 'def twoSum(nums, target):\n    # Your code here\n    pass',
        javascript: 'function twoSum(nums, target) {\n    // Your code here\n}',
        typescript: 'function twoSum(nums: number[], target: number): number[] {\n    // Your code here\n}'
      },
      testCases: [
        {
          input: '[2,7,11,15]\n9',
          expectedOutput: '[0,1]'
        }
      ]
    }
  ];

  findAll(): Problem[] {
    return this.problems;
  }

  findOne(id: string): Problem {
    return this.problems.find(problem => problem.id === id);
  }
}