const express = require('express')
const bookRouter = require('./routers/books')
const userRouter = require('./routers/users')
const recordRouter = require('./routers/records')
const cors = require('cors')


const app = express()

app.use(express.json())
app.use(cors())

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');



/**
 * API Routes
 */
app.use('/books', bookRouter)
app.use('/users', userRouter)
app.use('/issue', recordRouter)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * Response for wrong Endpoint
 */
app.all('/*', (req, res, next) => {
  const error = new Error(`Requested URL ${req.path} not found`);
  error.statusCode = 404;
  next(error) // Sending error with new statusCode to global error handler
})

/**
 * Global error Handler
 */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err);
  return res.status(statusCode).json({
    success: false,
    data: null,
    message: err.message,
  });
})

module.exports = app;
