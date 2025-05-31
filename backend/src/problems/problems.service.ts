import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProblemsService {
  private readonly problems = [
    {
      id: 1,
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
        js: `function twoSum(nums, target) {
    // Your code here
};`,
        py: `def twoSum(nums, target):
    # Your code here
    pass`,
        cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    // Your code here
}`,
        java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
    }
}`
      }
    }
  ];

  findAll() {
    return this.problems;
  }

  findOne(id: number) {
    const problem = this.problems.find(p => p.id === id);
    if (!problem) {
      throw new NotFoundException(`Problem with ID ${id} not found`);
    }
    return problem;
  }
}