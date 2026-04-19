export function formatAuditLog(log: any) {
  if (!log) return "Acción desconocida";
  const { action, details } = log;
  const d = details || {};
  
  switch (action) {
    case 'CREATE_APPOINTMENT':
      return `Creó un turno para ${d.patient_name || 'un paciente'} (${d.analysis_type || 'General'})`;
    case 'UPDATE_APPOINTMENT':
      return `Actualizó un turno de ${d.analysis_type || 'General'}`;
    case 'DELETE_APPOINTMENT':
      return `Eliminó un turno del sistema`;
    case 'LOGIN':
      return `Inició sesión en el sistema`;
    case 'LOGOUT':
      return `Cerró su sesión de trabajo`;
    case 'CREATE_USER':
      return `Creó al nuevo usuario @${d.username} (${d.role})`;
    case 'DELETE_USER':
      return `Eliminó permanentemente al usuario @${d.username}`;
    case 'ADMIN_UPDATE_USER':
      return `Modificó los datos del usuario @${d.username}`;
    case 'ADMIN_UPDATE_USER_AND_PWD':
      return `Actualizó al usuario @${d.username} y reseteó su clave`;
    case 'UPDATE_PROFILE_NAME':
      return `Actualizó su nombre en el perfil`;
    case 'UPDATE_PROFILE_WITH_PASSWORD':
      return `Cambió su contraseña y datos de perfil`;
    default:
      if (typeof action === 'string') {
        return action.replace(/_/g, ' ').toLowerCase();
      }
      return "Acción realizada";
  }
}
