import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ExecuteService {
  async executeCode({ code, language, input }) {
    try {
      const response = await axios.post('http://localhost:8080', {
        code,
        language,
        input
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}