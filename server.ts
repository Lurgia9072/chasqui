import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini Client server-side securely
  let ai: GoogleGenAI | null = null;
  
  const getGeminiClient = (): GoogleGenAI => {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('WARNING: GEMINI_API_KEY is not defined. AI operations will fall back to simulated responses.');
      }
      ai = new GoogleGenAI({
        apiKey: apiKey || 'MOCK_KEY',
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  };

  // -------------------------------------------------------------
  // secure server-side API endpoints
  // -------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', online: true });
  });

  // Proxy Gemini AI Requests
  app.post('/api/gemini/copilot', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
       res.status(400).json({ error: 'Debes ingresar un prompt' });
       return;
    }

    const client = getGeminiClient();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Elegant, high-fidelity mock fallback if key is missing (so it never crashes)
      setTimeout(() => {
        let answer = 'Hola, soy Chasqui CoPiloto. ';
        if (prompt.toLowerCase().includes('retraso') || prompt.toLowerCase().includes('demora')) {
          answer += 'Analizando la ruta Lima-Chimbote, preveo un retraso menor de 15 minutos en el kilómetro 204 de la Panamericana Norte debido a reparaciones asfálticas. Recomiendo mantener velocidad crucero de 60km/h.';
        } else if (prompt.toLowerCase().includes('riesgo') || prompt.toLowerCase().includes('radar')) {
          answer += 'El radar telemático reporta 1 incidente de temperatura crítica para el vehículo Placa F2W-894. La cadena de frío fluctuó a -4.5°C. Se aconseja ordenar purga inmediata en terminal.';
        } else if (prompt.toLowerCase().includes('oferta') || prompt.toLowerCase().includes('comerciante')) {
          answer += 'Asistente de Matching: La carga de Lote L-902 tiene un precio propuesto de S/. 1,800. Dos transportistas cercanos calificados con 4.8 estrellas están disponibles en un rango de 5km de la planta Chiclayo.';
        } else {
          answer += `Entendido. He procesado tu solicitud sobre logística avanzada: "${prompt}". Para realizar predicciones reales de SRE de Chasqui, asegúrate de configurar tu GEMINI_API_KEY en la sección Settings > Secrets.`;
        }
        res.json({ success: true, text: answer, isMock: true });
      }, 1000);
      return;
    }

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `Eres Chasqui CoPiloto, el asistente de inteligencia artificial del sistema operativo logístico inteligente Chasqui Enterprise en Latinoamérica. Responde de manera profesional, técnica, concisa y ejecutiva. Resuelve o ayuda con la siguiente solicitud: ${prompt}` }]
          }
        ]
      });

      res.json({ success: true, text: response.text });
    } catch (err: any) {
      console.error('Error invoking Gemini model:', err);
      res.status(500).json({ error: err.message || 'Error en el motor AI de Gemini' });
    }
  });

  // Vite development vs production serving patterns
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Chasqui Operator Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
