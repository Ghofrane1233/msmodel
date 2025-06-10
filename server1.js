const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5002; // Changement de port à 5001

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Base de données MySQL
const db = mysql.createConnection({
  host: 'localhost', // Remplacer par votre hôte
  user: 'root', // Remplacer par votre utilisateur
  password: '', // Remplacer par votre mot de passe
  database: 'boardhub' // Remplacer par le nom de votre base de données
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  }
  console.log('Connecté à la base de données MySQL');
});

// 1. Récupérer tous les modèles avec pagination
app.get('/model', (req, res) => {
  const page = parseInt(req.query.page) || 1; // Page actuelle (défaut : 1)
  const limit = parseInt(req.query.limit) || 10; // Nombre d’éléments par page (défaut : 10)
  const offset = (page - 1) * limit;

  const sql = 'SELECT * FROM parts_models ORDER BY created_at DESC LIMIT ? OFFSET ?';

  db.query(sql, [limit, offset], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des modèles:', err);
      return res.status(500).json({ message: 'Erreur interne du serveur' });
    }

    db.query('SELECT COUNT(*) AS total FROM parts_models', (err, countResult) => {
      if (err) {
        console.error('Erreur lors du comptage des modèles:', err);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
      }

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        data: results,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });
    });
  });
});

  
// 2. Ajouter un model
app.post('/model', (req, res) => {
  const { type, reference, manufacturer, brand, model } = req.body;
  const query = 'INSERT INTO parts_models (type, reference, manufacturer, brand, model) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [type, reference, manufacturer, brand, model], (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'ajout du modèle:', err);
      return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
    res.status(201).json({ message: 'Modèle ajouté avec succès', id: results.insertId });
  });
});

// 3. Modifier un model
app.put('/model/:id', (req, res) => {
  const { id } = req.params;
  const { type, reference, manufacturer, brand, model } = req.body;
  const query = 'UPDATE parts_models SET type = ?, reference = ?, manufacturer = ?, brand = ?, model = ? WHERE id = ?';
  db.query(query, [type, reference, manufacturer, brand, model, id], (err, results) => {
    if (err) {
      console.error('Erreur lors de la modification du modèle:', err);
      return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Modèle non trouvé' });
    }
    res.json({ message: 'Modèle modifié avec succès' });
  });
});


// 4. Supprimer un model
app.delete('/model/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM parts_models WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Erreur lors de la suppression du modèle:', err);
      return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Modèle non trouvé' });
    }
    res.json({ message: 'Modèle supprimé avec succès' });
  });
});



app.get('/model/count', (req, res) => {
  db.query('SELECT COUNT(*) AS total FROM parts_models', (err, result) => {
    if (err) {
      console.error('Erreur lors du comptage des modèles:', err);
      return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
    res.json({ total: result[0].total });
  });
});



// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur de gestion des model en cours d'exécution sur http://localhost:${port}`);
});
