const Ticket = require('../models/Ticket');
const classifyTicket = require('../services/classifyTicket');
const findDuplicates = require('../services/findDuplicates');
const User = require('../models/User');
const { isNonEmptyString } = require('../utils/validate');

const SLA_HOURS = { Critical: 2, High: 8, Medium: 24, Low: 72 };

const ALLOWED_TRANSITIONS = {
  Open: ['In Progress', 'Cancelled'],
  'In Progress': ['Resolved', 'Cancelled'],
  Resolved: ['Closed', 'In Progress'],
  Closed: [],
  Cancelled: ['Open'],
};

function canAccessTicket(user, ticket) {
  if (user.role === 'Manager' || user.role === 'Admin') return true;

  const reporterId = String(ticket.reportedBy?._id || ticket.reportedBy);
  const assigneeId = ticket.assignedTo
    ? String(ticket.assignedTo._id || ticket.assignedTo)
    : null;

  if (user.role === 'Reporter') return reporterId === String(user.userId);
  if (user.role === 'Engineer') return assigneeId === String(user.userId);
  return false;
}

exports.createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;

   if (!isNonEmptyString(title, 150) || !isNonEmptyString(description, 5000)) {
  return res.status(400).json({ success: false, message: 'Title (max 150) and description (max 5000) must be text' });
}

    const { category, priority } = classifyTicket(title, description);
    const hoursToAdd = SLA_HOURS[priority];
    const slaDeadline = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);

    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority,
      reportedBy: req.user.userId,
      slaDeadline,
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email');
    res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let tickets;

    if (role === 'Reporter') {
      tickets = await Ticket.find({ reportedBy: userId });
    } else if (role === 'Engineer') {
      tickets = await Ticket.find({ assignedTo: userId });
    } else {
      return res.status(403).json({ success: false, message: 'Use /api/tickets for your role' });
    }

    res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    if (!canAccessTicket(req.user, ticket)) {
  return res.status(404).json({ success: false, message: 'Ticket not found' });
}
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    if (req.user.role === 'Engineer' && String(ticket.assignedTo) !== String(req.user.userId)) {
  return res.status(403).json({ success: false, message: 'You can only update tickets assigned to you' });
}
    const allowedNext = ALLOWED_TRANSITIONS[ticket.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move from "${ticket.status}" to "${status}"`,
      });
    }

    ticket.status = status;
    if (status === 'Resolved') {
      ticket.resolutionNote = resolutionNote || ticket.resolutionNote;
      ticket.resolvedAt = new Date();
    }

    if (status === 'In Progress') {
  ticket.resolvedAt = undefined;
}

if (typeof status !== 'string' || (resolutionNote !== undefined && !isNonEmptyString(resolutionNote, 2000))) {
  return res.status(400).json({ success: false, message: 'Invalid status or resolution note' });
}

    await ticket.save();
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};

exports.assignTicket = async (req, res) => {
  try {
    const { engineerId } = req.body;
    if (!engineerId) {
      return res.status(400).json({ success: false, message: 'engineerId is required' });
    }
    if (!/^[a-f\d]{24}$/i.test(String(engineerId))) {
  return res.status(400).json({ success: false, message: 'Invalid engineerId' });
}

const engineer = await User.findById(engineerId);
if (!engineer || engineer.role !== 'Engineer') {
  return res.status(400).json({ success: false, message: 'engineerId must belong to an Engineer' });
}
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.assignedTo = engineerId;
    await ticket.save();

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.status(200).json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};

exports.checkDuplicates = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!isNonEmptyString(title, 150) || !isNonEmptyString(description, 5000)) {
  return res.status(400).json({ success: false, message: 'Title (max 150) and description (max 5000) must be text' });
}

    const recentTickets = await Ticket.find({
      status: { $in: ['Open', 'In Progress'] },
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    }).limit(20);

    const result = findDuplicates(title, description, recentTickets);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(200).json({ success: true, isDuplicate: false, matches: [] });
  }
};