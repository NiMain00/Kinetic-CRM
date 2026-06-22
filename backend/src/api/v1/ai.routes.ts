import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { aiRateLimiter } from '../../middleware/rate-limiter';
import { GeminiAdapter } from '../../services/ai/gemini.adapter';
import { AiServiceImpl } from '../../services/ai/ai-service.impl';
import { env } from '../../config/env';

const router = Router();

function getAiService() {
  const provider = new GeminiAdapter(env.GEMINI_API_KEY, env.AI_MODEL);
  return new AiServiceImpl(provider);
}

function handleError(res: any, err: any) {
  const status = err.statusCode || 500;
  const code = err.errorCode || 'AI_ERROR';
  const message = err.message || 'Terjadi kesalahan pada layanan AI';
  return res.status(status).json({ success: false, error: { code, message } });
}

router.use(authMiddleware, requirePermission('ai:access'), aiRateLimiter);

router.post('/summarize/rks', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Konten tidak boleh kosong' } });
    const ai = getAiService();
    const result = await ai.summarize('rks_summary', content, req.user?.userId);
    res.json({ success: true, data: { summary: result } });
  } catch (err) { handleError(res, err); }
});

router.post('/summarize/lphs', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Konten tidak boleh kosong' } });
    const ai = getAiService();
    const result = await ai.summarize('lphs_summary', content, req.user?.userId);
    res.json({ success: true, data: { summary: result } });
  } catch (err) { handleError(res, err); }
});

router.post('/summarize/tender', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Konten tidak boleh kosong' } });
    const ai = getAiService();
    const result = await ai.summarize('tender_summary', content, req.user?.userId);
    res.json({ success: true, data: { summary: result } });
  } catch (err) { handleError(res, err); }
});

router.post('/summarize/meeting', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Konten tidak boleh kosong' } });
    const ai = getAiService();
    const result = await ai.summarize('meeting_summary', content, req.user?.userId);
    res.json({ success: true, data: { summary: result } });
  } catch (err) { handleError(res, err); }
});

router.post('/analyze/prospect', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Konten tidak boleh kosong' } });
    const ai = getAiService();
    const result = await ai.analyze('prospect_analysis', content, req.user?.userId);
    res.json({ success: true, data: result });
  } catch (err) { handleError(res, err); }
});

router.post('/analyze/competitor', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Konten tidak boleh kosong' } });
    const ai = getAiService();
    const result = await ai.extractInsight('competitor_analysis', content, req.user?.userId);
    res.json({ success: true, data: { insight: result } });
  } catch (err) { handleError(res, err); }
});

router.post('/analyze/customer', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Konten tidak boleh kosong' } });
    const ai = getAiService();
    const result = await ai.extractInsight('customer_insight', content, req.user?.userId);
    res.json({ success: true, data: { insight: result } });
  } catch (err) { handleError(res, err); }
});

router.post('/insight/kpi', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Data KPI tidak boleh kosong' } });
    const ai = getAiService();
    const result = await ai.extractInsight('kpi_insight', content, req.user?.userId);
    res.json({ success: true, data: { insight: result } });
  } catch (err) { handleError(res, err); }
});

router.post('/insight/dashboard', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Data dashboard tidak boleh kosong' } });
    const ai = getAiService();
    const result = await ai.extractInsight('dashboard_summary', content, req.user?.userId);
    res.json({ success: true, data: { summary: result } });
  } catch (err) { handleError(res, err); }
});

router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Kueri pencarian tidak boleh kosong' } });
    const ai = getAiService();
    const result = await ai.extractInsight('smart_search', query, req.user?.userId);
    res.json({ success: true, data: { result } });
  } catch (err) { handleError(res, err); }
});

export default router;
