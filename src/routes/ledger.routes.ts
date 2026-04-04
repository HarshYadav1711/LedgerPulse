import { Router } from "express";
import * as entryController from "../controllers/entry.controller";
import * as exportController from "../controllers/export.controller";
import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createEntryBodySchema,
  entryIdParamSchema,
  listEntriesQuerySchema,
  summaryQuerySchema,
  updateEntryBodySchema,
} from "../validation/entry.schemas";

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /me:
 *   get:
 *     tags: [User]
 *     summary: Current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Public user profile
 *       401:
 *         description: Unauthorized
 */
router.get("/me", userController.me);

/**
 * @swagger
 * /entries:
 *   get:
 *     tags: [Ledger]
 *     summary: List ledger entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: Paginated entries
 *   post:
 *     tags: [Ledger]
 *     summary: Create a ledger entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, description, occurredAt]
 *             properties:
 *               amount: { type: number, exclusiveMinimum: 0 }
 *               type: { type: string, enum: [CREDIT, DEBIT] }
 *               description: { type: string }
 *               occurredAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Entry created
 */
router.get(
  "/entries",
  validate({ query: listEntriesQuerySchema }),
  entryController.list
);
router.post(
  "/entries",
  validate({ body: createEntryBodySchema }),
  entryController.create
);

/**
 * @swagger
 * /entries/{id}:
 *   get:
 *     tags: [Ledger]
 *     summary: Get one entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Entry
 *       404:
 *         description: Not found
 *   patch:
 *     tags: [Ledger]
 *     summary: Update an entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               type: { type: string, enum: [CREDIT, DEBIT] }
 *               description: { type: string }
 *               occurredAt: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Updated entry
 *   delete:
 *     tags: [Ledger]
 *     summary: Delete an entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get(
  "/entries/:id",
  validate({ params: entryIdParamSchema }),
  entryController.getOne
);
router.patch(
  "/entries/:id",
  validate({ params: entryIdParamSchema, body: updateEntryBodySchema }),
  entryController.update
);
router.delete(
  "/entries/:id",
  validate({ params: entryIdParamSchema }),
  entryController.remove
);

/**
 * @swagger
 * /summary:
 *   get:
 *     tags: [Ledger]
 *     summary: Balance pulse — totals and net balance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Aggregates for the user (and optional date range)
 */
router.get(
  "/summary",
  validate({ query: summaryQuerySchema }),
  entryController.summary
);

/**
 * @swagger
 * /exports/entries:
 *   get:
 *     tags: [Export]
 *     summary: Download all entries as CSV
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/exports/entries", exportController.entriesCsv);

export default router;
