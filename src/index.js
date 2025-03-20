import express from 'express'
import complexRoute from './route/complexRoute.js'
import userRoute from './route/userRoute.js'
import { setupSwagger } from '../swagger.js';

const app = express()
app.use(express.json())
setupSwagger(app);  

app.use(complexRoute, userRoute)

app.listen('3000', () =>{
    console.log('Server rodando em https://localhost:3000')
})