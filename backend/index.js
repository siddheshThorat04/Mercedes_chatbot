const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const XLSX = require('xlsx');
const OpenAI = require('openai');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load and parse Excel once at startup
function loadExcelData() {
    const filePath = path.join(__dirname, 'Mercedes_eSprinter_Countries_Combinations__2_.xlsx');
    const workbook = XLSX.readFile(filePath);
  const summary = {};

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Row 0 = metadata/title, Row 1 = column headers, Row 2+ = data
    const headers = rows[1];
    const data = rows.slice(2).map(row => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
      return obj;
    });
    summary[sheetName] = { headers, rowCount: data.length, data };
  });

  return summary;
}

const excelData = loadExcelData();

// Build a concise text summary for the LLM context
function buildDataContext() {
  let context = '';
  for (const [country, { headers, rowCount, data }] of Object.entries(excelData)) {
    context += `\n## ${country} (${rowCount} combinations)\n`;
    context += `Columns: ${headers.filter(Boolean).join(', ')}\n`;

    // Price range
    const totalNetCol = headers.find(h => h && h.toLowerCase().includes('config total net'));
    if (totalNetCol) {
      const prices = data.map(r => parseFloat(String(r[totalNetCol]).replace(/[€,]/g, ''))).filter(n => !isNaN(n));
      if (prices.length) {
        context += `Config total net range: €${Math.min(...prices).toLocaleString()} – €${Math.max(...prices).toLocaleString()}\n`;
      }
    }

    // Unique values for key columns
    ['Battery', 'Line', 'Color category', 'Roof type'].forEach(col => {
      const actualCol = headers.find(h => h && h.toLowerCase().includes(col.toLowerCase()));
      if (actualCol) {
        const unique = [...new Set(data.map(r => r[actualCol]).filter(Boolean))];
        if (unique.length) context += `${col}: ${unique.join(', ')}\n`;
      }
    });
  }
  return context;
}

const DATA_CONTEXT = buildDataContext();

const SYSTEM_PROMPT = `You are an expert analyst for Mercedes-Benz eSprinter configurator pricing data 
across 5 European countries: France, Italy, Spain, Germany, and UK.

You answer questions clearly and concisely based on the dataset below.
- Always specify net (excl. VAT) vs gross (incl. VAT) when giving prices
- Give specific numbers when available
- If asked to compare countries, structure the comparison clearly
- If a question is outside this dataset, politely say so
- Never fabricate data

DATASET SUMMARY:
${DATA_CONTEXT}`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 800,
      temperature: 0.3,
    });

    res.json({ answer: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'LLM request failed', detail: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));