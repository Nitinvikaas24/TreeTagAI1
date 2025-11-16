import { expect } from 'chai';
import request from 'supertest';
import { app } from '../app.js';

describe('Authentication Tests', () => {
    let authToken;
    
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!'
    };

    before(() => {
        // Clear any existing test users
        if (global.store && global.store.users) {
            global.store.users = global.store.users.filter(u => u.email !== testUser.email);
        }
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).to.equal(201);
            expect(res.body).to.have.property('token');
            expect(res.body).to.have.property('user');
            expect(res.body.user).to.have.property('email', testUser.email);
            expect(res.body.user).to.have.property('name', testUser.name);
            expect(res.body.user).to.have.property('role', 'user');
        });

        it('should not allow duplicate registration', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).to.equal(400);
            expect(res.body).to.have.property('error', 'User already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('token');
            expect(res.body).to.have.property('user');
            expect(res.body.user).to.have.property('email', testUser.email);
            authToken = res.body.token;
        });

        it('should fail with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.statusCode).to.equal(400);
            expect(res.body).to.have.property('error', 'Invalid credentials');
        });

        it('should fail with non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test123!'
                });

            expect(res.statusCode).to.equal(400);
            expect(res.body).to.have.property('error', 'Invalid credentials');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should get user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('email', testUser.email);
            expect(res.body).to.have.property('name', testUser.name);
            expect(res.body).to.have.property('role', 'user');
        });

        it('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.statusCode).to.equal(401);
            expect(res.body).to.have.property('error', 'Invalid token');
        });

        it('should fail without token', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.statusCode).to.equal(401);
            expect(res.body).to.have.property('error', 'Authentication required');
        });
    });

    describe('POST /api/auth/change-password', () => {
        it('should change password successfully', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: testUser.password,
                    newPassword: 'NewTest123!'
                });

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('message', 'Password updated successfully');

            // Verify can login with new password
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'NewTest123!'
                });

            expect(loginRes.statusCode).to.equal(200);
            expect(loginRes.body).to.have.property('token');
        });

        it('should fail with incorrect current password', async () => {
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'wrongpassword',
                    newPassword: 'NewTest456!'
                });

            expect(res.statusCode).to.equal(400);
            expect(res.body).to.have.property('error', 'Current password is incorrect');
        });
    });
});