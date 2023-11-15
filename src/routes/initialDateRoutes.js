import express from 'express';
import service from '../services/initialDateService.js';

const app = express.Router();

app.post('/', service.setInitialDate);

app.use((error, req, res, next) => {
  console.log(
    `${req.method} ${req.baseUrl} - ${JSON.stringify(error.message)}`
  );
  res.status(500).send({ error: error.message });
});

export { app as initialDateRouter };
