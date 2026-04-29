import { Router } from 'express';
import { exampleService } from '../services/main.service';

const router = Router();

/**
 * @swagger
 * /example:
 *   get:
 *     summary: Example endpoint
 *     tags: [Example]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/example', (_req, res) => {
  res.json({
    success: true,
    data: exampleService(),
  });
});

export default router;
