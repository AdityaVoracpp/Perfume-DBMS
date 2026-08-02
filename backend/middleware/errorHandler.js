/**
 * Global error handler middleware.
 * Catches unhandled errors thrown in route handlers and returns a clean JSON response.
 */
function errorHandler(err, _req, res, _next) {
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate entry. This record already exists.' });
  }

  // MySQL foreign key constraint failure
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }

  // Validation errors (manually thrown)
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
