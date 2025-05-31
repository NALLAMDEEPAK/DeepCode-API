import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ExecuteService {
  async execute({ code, language, input }: { code: string; language: string; input: string }) {
    try {
      const response = await axios.post('http://localhost:8080', {
        code,
        language,
        input
      });
      return response.data;
    } catch (error) {
      return {
        error: error.message,
        output: '',
        language
      };
    }
  }
}