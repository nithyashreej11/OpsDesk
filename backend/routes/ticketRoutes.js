const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  createTicket,
  getAllTickets,
  getMyTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  deleteTicket,
  checkDuplicates,
} = require('../controllers/ticketController');

router.post('/check-duplicates', authMiddleware, roleMiddleware(['Reporter']), checkDuplicates);
router.post('/', authMiddleware, roleMiddleware(['Reporter']), createTicket);
router.get('/', authMiddleware, roleMiddleware(['Manager', 'Admin']), getAllTickets);
router.get('/my', authMiddleware, roleMiddleware(['Reporter', 'Engineer']), getMyTickets);
router.get('/:id', authMiddleware, getTicketById);
router.patch('/:id/status', authMiddleware, roleMiddleware(['Engineer', 'Manager', 'Admin']), updateTicketStatus);
router.patch('/:id/assign', authMiddleware, roleMiddleware(['Manager', 'Admin']), assignTicket);
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), deleteTicket);

module.exports = router;