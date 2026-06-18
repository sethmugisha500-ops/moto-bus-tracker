import { Router } from 'express';

const router = Router();

router.post('/single', (req, res) => {
  res.json({ success: true, url: 'https://example.com/image.jpg' });
});

export default router;