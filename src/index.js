import express from 'express'
import complexRoute from './route/complexRoute.js'
import userRoute from './route/userRoute.js'
import requisitionRoute from './route/requisitionRoute.js'
import tokenRoute from './route/tokenRoute.js'
import { setupSwagger } from '../swagger.js'

const app = express()
app.use(express.json())
setupSwagger(app);  

app.use(complexRoute, userRoute, requisitionRoute, tokenRoute)

app.listen('3000', () =>{
    console.log('Server rodando em http://localhost:3000')
})