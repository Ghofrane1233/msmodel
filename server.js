require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT ;
const JWT_SECRET = process.env.JWT_SECRET;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ,
  waitForConnections: true,
  connectionLimit: 10
};
const pool = mysql.createPool(dbConfig);
// Middleware de vérification du token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Accès interdit' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    req.user = user;
    next();
  });
}


// GET tous les modèles avec pagination
app.get('/model', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [models] = await pool.query('SELECT * FROM parts_models ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM parts_models');

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: models,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur récupération modèles:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST ajouter un modèle
app.post('/model', authenticateToken, async (req, res) => {
  const { type, reference, manufacturer, brand, model } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO parts_models (type, reference, manufacturer, brand, model) VALUES (?, ?, ?, ?, ?)',
      [type, reference, manufacturer, brand, model]
    );
    res.status(201).json({ message: 'Modèle ajouté', id: result.insertId });
  } catch (error) {
    console.error('Erreur ajout modèle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT modifier un modèle
app.put('/model/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { type, reference, manufacturer, brand, model } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE parts_models SET type = ?, reference = ?, manufacturer = ?, brand = ?, model = ? WHERE id = ?',
      [type, reference, manufacturer, brand, model, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Modèle non trouvé' });
    }
    res.json({ message: 'Modèle modifié' });
  } catch (error) {
    console.error('Erreur modification modèle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE supprimer un modèle
app.delete('/model/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM parts_models WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Modèle non trouvé' });
    }
    res.json({ message: 'Modèle supprimé' });
  } catch (error) {
    console.error('Erreur suppression modèle:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET compter les modèles
app.get('/model/count', authenticateToken, async (req, res) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM parts_models');
    res.json({ total });
  } catch (error) {
    console.error('Erreur comptage modèles:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur en cours sur http://localhost:${PORT}`);
});

module.exports = app; // export pour les tests
