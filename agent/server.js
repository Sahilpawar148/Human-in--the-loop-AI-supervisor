import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4001;

app.use(cors());

app.get('/api/kb', (req, res) => {
  const kbPath = path.join(__dirname, 'knowledge_base.json');

  try {
    const data = fs.readFileSync(kbPath, 'utf-8');
    const parsed = JSON.parse(data);

    if (!parsed.faqs || typeof parsed.faqs !== 'object') {
      throw new Error('Invalid KB format: missing or invalid `faqs` object');
    }

    const learnedFaqs = Object.entries(parsed.faqs)
      .filter(([_, value]) => value?.source === 'learned')
      .reduce((acc, [q, val]) => {
        acc[q] = val.answer;
        return acc;
      }, {});

    res.json(learnedFaqs);
  } catch (err) {
    console.error('--> ALERT: Failed to read KB:', err.message);
    res.status(500).json({ error: 'Could not load knowledge base' });
  }
});

app.listen(PORT, () => {
  console.log(`📚 KB API running at http://localhost:${PORT}/api/kb`);
});