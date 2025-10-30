const sendSuccess = (res, data = null, meta = null, status = 200) => {
  const payload = { success: true };
  if (data !== null && data !== undefined) payload.data = data;
  if (meta) payload.meta = meta;
  return res.status(status).json(payload);
};

const sendError = (res, message = 'An error occurred', status = 400, details = null) => {
  const payload = { success: false, error: { message } };
  if (details) payload.error.details = details;
  return res.status(status).json(payload);
};

module.exports = {
  sendSuccess,
  sendError
};


