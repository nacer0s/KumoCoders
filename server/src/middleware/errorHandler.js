export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    console.error('[ErrorHandler]', err);
    return res.status(status).json({
      error: err.message || 'Internal server error',
      stack: err.stack,
    });
  }

  console.error('[ErrorHandler]', err.message || err);
  res.status(status).json({ error: 'Internal server error' });
}
