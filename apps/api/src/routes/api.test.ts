import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import repositoryStore from '../services/repositoryStore.js';

describe('REST API Endpoints Integration Tests', () => {
  beforeAll(() => {
    // Seed a mock repository into the store for testing
    repositoryStore.addRepository({
      repositoryId: 'test-repo-id',
      name: 'test-repo',
      branch: 'main',
      path: '/mock/path',
      createdAt: new Date().toISOString(),
    });
  });

  it('GET /health should return 200 and success details', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('GET /repositories/active should return the active repository details', async () => {
    const res = await request(app).get('/repositories/active');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.repositoryId).toBe('test-repo-id');
  });

  it('POST /chat should validate fields and return 400 for missing question parameter', async () => {
    const res = await request(app).post('/chat').send({ repositoryId: 'test-repo-id' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });

  it('POST /chat should return 404 for non-existent repository', async () => {
    const res = await request(app)
      .post('/chat')
      .send({ repositoryId: 'non-existent-id', question: 'How is code structured?' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
