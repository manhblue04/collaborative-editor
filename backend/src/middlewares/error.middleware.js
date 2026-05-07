const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let error = err.message || "Internal Server Error";

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    statusCode = 409;
  }

  if (err.name === "ValidationError") {
    error = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    statusCode = 400;
  }

  if (err.name === "CastError") {
    error = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  res.status(statusCode).json({
    error,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export default errorHandler;
