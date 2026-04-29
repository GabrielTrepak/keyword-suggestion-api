import { Router } from 'express';
import { getKeywordSuggestions } from '../services/main.service';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Keywords
 *     description: SEO keyword research endpoints
 */

/**
 * @swagger
 * /keyword/suggestions:
 *   get:
 *     summary: Get keyword suggestions from Google Autocomplete
 *     description: Returns SEO keyword suggestions based on one or multiple search queries. Supports country and language targeting.
 *     tags: [Keywords]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           example: iphone,samsung laptop
 *         description: Search query. You can send one keyword or multiple keywords separated by commas.
 *       - in: query
 *         name: country
 *         required: false
 *         schema:
 *           type: string
 *           example: US
 *         description: Country code used for localized suggestions.
 *       - in: query
 *         name: language
 *         required: false
 *         schema:
 *           type: string
 *           example: en
 *         description: Language code used for localized suggestions.
 *     responses:
 *       200:
 *         description: Successful keyword suggestion response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       query:
 *                         type: string
 *                         example: iphone
 *                       suggestions:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example:
 *                           - iphone 15
 *                           - iphone 15 pro max
 *                           - iphone charger
 *                       count:
 *                         type: number
 *                         example: 3
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalQueries:
 *                       type: number
 *                       example: 1
 *                     country:
 *                       type: string
 *                       example: US
 *                     language:
 *                       type: string
 *                       example: en
 *                     source:
 *                       type: string
 *                       example: google_autocomplete
 *                     cached:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Invalid request
 */
router.get('/keyword/suggestions', async (req, res, next) => {
  try {
    const { q, country, language } = req.query;

    const result = await getKeywordSuggestions(
      String(q || ''),
      String(country || 'US'),
      String(language || 'en')
    );

    return res.json({
      success: true,
      data: result.results,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
});

export default router;