const AuditLog = require('../models/AuditLog');

async function logActivity({ organizationId, userId, action, entityType, entityId, details, req }) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';
    await AuditLog.create({
      organization: organizationId,
      user: userId,
      action,
      entityType,
      entityId: String(entityId || ''),
      details: details || {},
      ipAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logActivity };
