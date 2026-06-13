/**
 * src/tests/user.test.js
 * Integration tests for User module (registration, updates, deletes, and authentication).
 */

const request = require('supertest');
const app = require('../app');
const fs = require('fs/promises');
const path = require('path');

const usersFile = path.join(__dirname, '../data/users.json');
const transactionsFile = path.join(__dirname, '../data/transactions.json');

describe('User Endpoints & JWT Authentication Integration Tests', () => {
  beforeEach(async () => {
    await fs.mkdir(path.dirname(usersFile), { recursive: true });
    await fs.writeFile(usersFile, JSON.stringify([], null, 2), 'utf8');

    await fs.mkdir(path.dirname(transactionsFile), { recursive: true });
    await fs.writeFile(transactionsFile, JSON.stringify([], null, 2), 'utf8');
  });

  afterAll(async () => {
    await fs.writeFile(usersFile, JSON.stringify([], null, 2), 'utf8');
    await fs.writeFile(transactionsFile, JSON.stringify([], null, 2), 'utf8');
  });

  describe('POST /users (Registration)', () => {
    it('should register a new user successfully and return status 201 with token', async () => {
      const res = await request(app)
        .post('/users')
        .send({
          name: 'Akash Nair',
          email: 'akash@gmail.com'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Akash Nair');
      expect(res.body.data.email).toBe('akash@gmail.com');
    });

    it('should fail with 400 when name is missing', async () => {
      const res = await request(app)
        .post('/users')
        .send({
          email: 'akash@gmail.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('name is required');
    });

    it('should fail with 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/users')
        .send({
          name: 'Akash Nair',
          email: 'invalid-email-format'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please provide a valid email address');
    });

    it('should return 400 duplicate email message', async () => {
      await request(app)
        .post('/users')
        .send({
          name: 'Akash Nair',
          email: 'akash@gmail.com'
        });

      const res = await request(app)
        .post('/users')
        .send({
          name: 'Akash Nair Duplicate',
          email: 'akash@gmail.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already exists');
    });
  });

  describe('PATCH /users/:id (Protected Update)', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/users')
        .send({
          name: 'Akash Nair',
          email: 'akash@gmail.com'
        });
      token = res.body.token;
      userId = res.body.data.id;
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .patch(`/users/${userId}`)
        .send({ name: 'Akash Updated' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No token provided');
    });

    it('should return 401 for an invalid token', async () => {
      const res = await request(app)
        .patch(`/users/${userId}`)
        .set('Authorization', 'Bearer invalid-token-sig')
        .send({ name: 'Akash Updated' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when trying to update another user profile', async () => {
      const res = await request(app)
        .patch('/users/some-other-uuid')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Akash Updated' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized to update this user');
    });

    it('should successfully update name and email with a valid token', async () => {
      const res = await request(app)
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Akash Nair Updated',
          email: 'newemail@gmail.com'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Akash Nair Updated');
      expect(res.body.data.email).toBe('newemail@gmail.com');
    });

    it('should fail to update email if it is already taken by another user', async () => {
      // Register another user
      await request(app)
        .post('/users')
        .send({
          name: 'Second User',
          email: 'second@gmail.com'
        });

      const res = await request(app)
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'second@gmail.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already exists');
    });
  });

  describe('DELETE /users/:id (Protected Delete with Cascade)', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/users')
        .send({
          name: 'Akash Nair',
          email: 'akash@gmail.com'
        });
      token = res.body.token;
      userId = res.body.data.id;

      // Seed a transaction for this user
      const transactions = [
        {
          id: 'tx1',
          userId: userId,
          type: 'expense',
          category: 'Food',
          amount: 50,
          date: '2026-06-13'
        },
        {
          id: 'tx2',
          userId: 'other-user',
          type: 'expense',
          category: 'Food',
          amount: 100,
          date: '2026-06-13'
        }
      ];
      await fs.writeFile(transactionsFile, JSON.stringify(transactions, null, 2), 'utf8');
    });

    it('should return 403 when trying to delete another user profile', async () => {
      const res = await request(app)
        .delete('/users/some-other-uuid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should delete user and cascade delete their transactions', async () => {
      const res = await request(app)
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user is gone from users.json
      const usersData = JSON.parse(await fs.readFile(usersFile, 'utf8'));
      expect(usersData.some(u => u.id === userId)).toBe(false);

      // Verify user's transactions are gone, but other users' transactions remain
      const txData = JSON.parse(await fs.readFile(transactionsFile, 'utf8'));
      expect(txData.some(t => t.userId === userId)).toBe(false);
      expect(txData.some(t => t.userId === 'other-user')).toBe(true);
    });
  });
});
