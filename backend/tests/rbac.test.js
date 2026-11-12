process.env.JWT_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

let mongod;
let reporter1, reporter2, engineer1, engineer2, manager, admin, ticket;

const auth = (user) => ({
  Authorization: `Bearer ${jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' })}`,
});

const assignTo = async (user, status) => {
  ticket.assignedTo = user._id;
  if (status) ticket.status = status;
  await ticket.save();
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Ticket.deleteMany({});
  const mk = (name, role) => User.create({ name, email: `${name}@test.com`, password: 'x', role });
  reporter1 = await mk('reporter1', 'Reporter');
  reporter2 = await mk('reporter2', 'Reporter');
  engineer1 = await mk('engineer1', 'Engineer');
  engineer2 = await mk('engineer2', 'Engineer');
  manager = await mk('manager', 'Manager');
  admin = await mk('admin', 'Admin');
  ticket = await Ticket.create({
    title: 'Wifi down',
    description: 'Office wifi is not working',
    reportedBy: reporter1._id,
    slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
});

describe('registration', () => {
  test('ignores a role sent by the client', async () => {
    const res = await request(app).post('/api/users/register')
      .send({ name: 'Hacker', email: 'h@test.com', password: 'longpass123', role: 'Admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('Reporter');
  });

  test('rejects short passwords', async () => {
    const res = await request(app).post('/api/users/register')
      .send({ name: 'Sam', email: 's@test.com', password: 'short' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/tickets/:id', () => {
  const url = () => `/api/tickets/${ticket._id}`;

  test('owner reporter can read', async () => {
    expect((await request(app).get(url()).set(auth(reporter1))).status).toBe(200);
  });
  test('other reporter gets 404', async () => {
    expect((await request(app).get(url()).set(auth(reporter2))).status).toBe(404);
  });
  test('unassigned engineer gets 404', async () => {
    expect((await request(app).get(url()).set(auth(engineer1))).status).toBe(404);
  });
  test('assigned engineer can read', async () => {
    await assignTo(engineer1);
    expect((await request(app).get(url()).set(auth(engineer1))).status).toBe(200);
  });
  test('manager can read', async () => {
    expect((await request(app).get(url()).set(auth(manager))).status).toBe(200);
  });
  test('no token gets 401', async () => {
    expect((await request(app).get(url())).status).toBe(401);
  });
  test('invalid id gets 400', async () => {
    expect((await request(app).get('/api/tickets/abc').set(auth(manager))).status).toBe(400);
  });
});

describe('PATCH /api/tickets/:id/status', () => {
  const url = () => `/api/tickets/${ticket._id}/status`;

  test('unassigned engineer gets 403', async () => {
    const res = await request(app).patch(url()).set(auth(engineer1)).send({ status: 'In Progress' });
    expect(res.status).toBe(403);
  });
  test('assigned engineer can start work', async () => {
    await assignTo(engineer1);
    const res = await request(app).patch(url()).set(auth(engineer1)).send({ status: 'In Progress' });
    expect(res.status).toBe(200);
  });
  test('invalid transition gets 400', async () => {
    await assignTo(engineer1);
    const res = await request(app).patch(url()).set(auth(engineer1)).send({ status: 'Resolved' });
    expect(res.status).toBe(400);
  });
  test('reopening clears resolvedAt', async () => {
    await assignTo(engineer1, 'In Progress');
    await request(app).patch(url()).set(auth(engineer1)).send({ status: 'Resolved', resolutionNote: 'fixed' });
    expect((await Ticket.findById(ticket._id)).resolvedAt).toBeTruthy();
    await request(app).patch(url()).set(auth(engineer1)).send({ status: 'In Progress' });
    expect((await Ticket.findById(ticket._id)).resolvedAt).toBeFalsy();
  });
});

describe('PATCH /api/tickets/:id/assign', () => {
  const url = () => `/api/tickets/${ticket._id}/assign`;

  test('reporter cannot assign', async () => {
    const res = await request(app).patch(url()).set(auth(reporter1)).send({ engineerId: engineer1._id });
    expect(res.status).toBe(403);
  });
  test('cannot assign to a non-engineer', async () => {
    const res = await request(app).patch(url()).set(auth(manager)).send({ engineerId: reporter2._id });
    expect(res.status).toBe(400);
  });
  test('manager can assign to an engineer', async () => {
    const res = await request(app).patch(url()).set(auth(manager)).send({ engineerId: engineer2._id });
    expect(res.status).toBe(200);
    expect(String((await Ticket.findById(ticket._id)).assignedTo)).toBe(String(engineer2._id));
  });
});

describe('role-restricted routes', () => {
  test('reporter cannot list all tickets', async () => {
    expect((await request(app).get('/api/tickets').set(auth(reporter1))).status).toBe(403);
  });
  test('manager cannot delete', async () => {
    expect((await request(app).delete(`/api/tickets/${ticket._id}`).set(auth(manager))).status).toBe(403);
  });
  test('admin can delete', async () => {
    expect((await request(app).delete(`/api/tickets/${ticket._id}`).set(auth(admin))).status).toBe(200);
  });
});