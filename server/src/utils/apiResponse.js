const sendSuccess = (res, statusCode, message, data = null, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
};

const sendPaginatedSuccess = (res, statusCode, message, items, page, limit, totalRecords) => {
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  return res.status(statusCode).json({
    success: true,
    message,
    data: items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = { sendSuccess, sendPaginatedSuccess };
