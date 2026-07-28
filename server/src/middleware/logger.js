export function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const status = res.statusCode;

    let color;
    if (status >= 200 && status < 300) color = '\x1b[32m';
    else if (status >= 300 && status < 400) color = '\x1b[33m';
    else if (status >= 400 && status < 500) color = '\x1b[31m';
    else color = '\x1b[35m';

    console.log(`[${timestamp}] ${method} ${originalUrl} - ${color}${status}\x1b[0m - ${duration}ms`);
  });

  next();
}
