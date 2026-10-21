/** Format respons JSON konsisten untuk seluruh API. */
export function sendSuccess(res, data = null, message = 'Berhasil', statusCode = 200, meta = null) {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

export function sendCreated(res, data = null, message = 'Data berhasil ditambahkan') {
  return sendSuccess(res, data, message, 201);
}
