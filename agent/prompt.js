import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'knowledge_base.json');

const rawData = fs.readFileSync(filePath);
const parsedData = JSON.parse(rawData);

export const salonPrompt = parsedData;
