import express from 'express'; const app = express(); app.get('/', (req,res)=>res.send('Hello from backend')); app.listen(3001,()=>console.log('Backend running on port 3001'));
