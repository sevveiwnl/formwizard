import express, { Request, Response } from 'express';

const app = express();

// Example route
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from backend');
});

// Start the server on port 3001
app.listen(3001, () => {
  console.log('Backend running on port 3001');
});

