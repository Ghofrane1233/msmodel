const request = require('supertest');
const jwt = require('jsonwebtoken');

// ⚠️ Si ce fichier est "server.js", adapte ce chemin
const app = require('./server'); 

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret'; 

// Génère un token JWT valide pour les tests
const token = jwt.sign({ userId: 123 }, JWT_SECRET, { expiresIn: '1h' });

describe('Test Microservice /model', () => {
  test('GET /model/count with valid token should return total', async () => {
    const res = await request(app)
      .get('/model/count')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(typeof res.body.total).toBe('number');
  });

  test('GET /model/count without token should return 401', async () => {
    const res = await request(app).get('/model/count');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token manquant');
  });
});
