import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) {
  dotenv.config();
} else if (fs.existsSync('../.env')) {
  dotenv.config({ path: '../.env' });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'placeholder-key');

export const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
export const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
