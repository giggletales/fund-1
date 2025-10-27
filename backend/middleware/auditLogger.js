import { supabase } from '../config/supabase.js';

export const auditLogger = (action, resourceType = null) => {
  return async (req, res, next) => {
    const userId = req.body.user_id || req.query.user_id || req.headers['x-user-id'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (userId && data.success) {
        const resourceId = data.data?.id || null;
        const metadata = {
          method: req.method,
          path: req.path,
          timestamp: new Date().toISOString()
        };

        supabase
          .from('audit_logs')
          .insert({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata
          })
          .then(() => {})
          .catch(err => console.error('Audit log error:', err));
      }

      return originalJson(data);
    };

    next();
  };
};

export const logAuditEvent = async (userId, action, resourceType = null, resourceId = null, metadata = {}) => {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata
      });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};
