/**
 * Sistema de Internacionalización - Español
 * Todas las constantes de texto del sistema centralizadas
 */

export const MENSAJES = {
  // ============================================
  // ERRORES
  // ============================================
  ERRORES: {
    // Genéricos
    GENERICO: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
    NO_AUTORIZADO: 'No tienes permisos para realizar esta acción.',
    NO_AUTENTICADO: 'Debes iniciar sesión para continuar.',
    NO_ENCONTRADO: 'El recurso solicitado no fue encontrado.',
    VALIDACION_FALLIDA: 'Los datos ingresados no son válidos.',
    TIMEOUT: 'La operación tardó demasiado tiempo. Por favor, intenta nuevamente.',
    SIN_CONEXION: 'No hay conexión a internet. Verifica tu red.',
    
    // Autenticación
    CREDENCIALES_INVALIDAS: 'Email o contraseña incorrectos.',
    SESION_EXPIRADA: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    TOKEN_INVALIDO: 'Token de autenticación inválido.',
    
    // Pedidos
    PEDIDO_NO_ENCONTRADO: 'El pedido no fue encontrado.',
    PEDIDO_YA_PAGADO: 'Este pedido ya fue pagado.',
    PEDIDO_CANCELADO: 'Este pedido fue cancelado.',
    PEDIDO_ITEMS_VACIOS: 'El pedido debe tener al menos un item.',
    PEDIDO_ESTADO_INVALIDO: 'El estado del pedido no es válido.',
    
    // Mesas
    MESA_NO_ENCONTRADA: 'La mesa no fue encontrada.',
    MESA_OCUPADA: 'La mesa ya está ocupada.',
    MESA_YA_LIBRE: 'La mesa ya está libre.',
    MESA_NUMERO_DUPLICADO: 'Ya existe una mesa con ese número.',
    
    // Pagos
    PAGO_FALLIDO: 'El pago no pudo ser procesado.',
    PAGO_RECHAZADO: 'El pago fue rechazado.',
    PAGO_MONTO_INVALIDO: 'El monto del pago es inválido.',
    PAGO_YA_PROCESADO: 'Este pago ya fue procesado.',
    
    // Usuarios
    USUARIO_NO_ENCONTRADO: 'El usuario no fue encontrado.',
    EMAIL_YA_EXISTE: 'Ya existe un usuario con ese email.',
    PERMISOS_INSUFICIENTES: 'No tienes permisos suficientes.',
    
    // Menú
    ITEM_NO_ENCONTRADO: 'El item del menú no fue encontrado.',
    ITEM_NO_DISPONIBLE: 'Este item no está disponible en este momento.',
    
    // QR
    QR_INVALIDO: 'El código QR no es válido.',
    QR_EXPIRADO: 'El código QR ha expirado.',
    
    // Base de datos
    DB_ERROR: 'Error al acceder a la base de datos.',
    DB_CONSTRAINT: 'No se puede realizar la operación. Verifica las dependencias.',
  },

  // ============================================
  // ÉXITOS
  // ============================================
  EXITOS: {
    // Pedidos
    PEDIDO_CREADO: 'Pedido creado exitosamente.',
    PEDIDO_ACTUALIZADO: 'Pedido actualizado exitosamente.',
    PEDIDO_CANCELADO: 'Pedido cancelado exitosamente.',
    PEDIDO_COMPLETADO: 'Pedido completado exitosamente.',
    
    // Mesas
    MESA_CREADA: 'Mesa creada exitosamente.',
    MESA_ACTUALIZADA: 'Mesa actualizada exitosamente.',
    MESA_ELIMINADA: 'Mesa eliminada exitosamente.',
    MESA_OCUPADA: 'Mesa marcada como ocupada.',
    MESA_LIBERADA: 'Mesa liberada exitosamente.',
    
    // Pagos
    PAGO_PROCESADO: 'Pago procesado exitosamente.',
    PAGO_CONFIRMADO: 'Pago confirmado exitosamente.',
    
    // Usuarios
    USUARIO_CREADO: 'Usuario creado exitosamente.',
    USUARIO_ACTUALIZADO: 'Usuario actualizado exitosamente.',
    USUARIO_ELIMINADO: 'Usuario eliminado exitosamente.',
    
    // Autenticación
    LOGIN_EXITOSO: 'Sesión iniciada exitosamente.',
    LOGOUT_EXITOSO: 'Sesión cerrada exitosamente.',
    REGISTRO_EXITOSO: 'Registro completado exitosamente.',
    
    // General
    GUARDADO_EXITOSO: 'Guardado exitosamente.',
    ELIMINADO_EXITOSO: 'Eliminado exitosamente.',
    ACTUALIZADO_EXITOSO: 'Actualizado exitosamente.',
  },

  // ============================================
  // LABELS (UI)
  // ============================================
  LABELS: {
    // Campos comunes
    EMAIL: 'Email',
    CONTRASENA: 'Contraseña',
    NOMBRE: 'Nombre',
    APELLIDO: 'Apellido',
    TELEFONO: 'Teléfono',
    DIRECCION: 'Dirección',
    DESCRIPCION: 'Descripción',
    PRECIO: 'Precio',
    CANTIDAD: 'Cantidad',
    TOTAL: 'Total',
    SUBTOTAL: 'Subtotal',
    FECHA: 'Fecha',
    HORA: 'Hora',
    ESTADO: 'Estado',
    ACCIONES: 'Acciones',
    
    // Pedidos
    NUMERO_PEDIDO: 'Número de Pedido',
    ITEMS_PEDIDO: 'Items del Pedido',
    NOTAS_PEDIDO: 'Notas del Pedido',
    
    // Mesas
    NUMERO_MESA: 'Número de Mesa',
    CAPACIDAD: 'Capacidad',
    ZONA: 'Zona',
    
    // Pagos
    METODO_PAGO: 'Método de Pago',
    MONTO: 'Monto',
    PROPINA: 'Propina',
    
    // Usuarios
    ROL: 'Rol',
    PERMISOS: 'Permisos',
  },

  // ============================================
  // PLACEHOLDERS
  // ============================================
  PLACEHOLDERS: {
    INGRESE_EMAIL: 'Ingrese su email',
    INGRESE_CONTRASENA: 'Ingrese su contraseña',
    INGRESE_NOMBRE: 'Ingrese el nombre',
    INGRESE_DESCRIPCION: 'Ingrese una descripción',
    BUSCAR: 'Buscar...',
    SELECCIONE: 'Seleccione una opción',
    NOTAS_OPCIONALES: 'Notas opcionales...',
  },

  // ============================================
  // BOTONES
  // ============================================
  BOTONES: {
    GUARDAR: 'Guardar',
    CANCELAR: 'Cancelar',
    ELIMINAR: 'Eliminar',
    EDITAR: 'Editar',
    CREAR: 'Crear',
    ACTUALIZAR: 'Actualizar',
    CONFIRMAR: 'Confirmar',
    VOLVER: 'Volver',
    CERRAR: 'Cerrar',
    BUSCAR: 'Buscar',
    LIMPIAR: 'Limpiar',
    ENVIAR: 'Enviar',
    
    // Pedidos
    CREAR_PEDIDO: 'Crear Pedido',
    CANCELAR_PEDIDO: 'Cancelar Pedido',
    COMPLETAR_PEDIDO: 'Completar Pedido',
    
    // Mesas
    OCUPAR_MESA: 'Ocupar Mesa',
    LIBERAR_MESA: 'Liberar Mesa',
    
    // Pagos
    PROCESAR_PAGO: 'Procesar Pago',
    DIVIDIR_CUENTA: 'Dividir Cuenta',
    
    // Auth
    INICIAR_SESION: 'Iniciar Sesión',
    CERRAR_SESION: 'Cerrar Sesión',
    REGISTRARSE: 'Registrarse',
  },

  // ============================================
  // ESTADOS
  // ============================================
  ESTADOS: {
    // Pedidos
    PEDIDO: {
      PENDIENTE: 'Pendiente',
      EN_PREPARACION: 'En Preparación',
      LISTO: 'Listo',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
    },
    
    // Mesas
    MESA: {
      LIBRE: 'Libre',
      OCUPADA: 'Ocupada',
      RESERVADA: 'Reservada',
      LIMPIEZA: 'En Limpieza',
    },
    
    // Pagos
    PAGO: {
      PENDIENTE: 'Pendiente',
      PROCESANDO: 'Procesando',
      COMPLETADO: 'Completado',
      FALLIDO: 'Fallido',
      RECHAZADO: 'Rechazado',
    },
  },

  // ============================================
  // CONFIRMACIONES
  // ============================================
  CONFIRMACIONES: {
    ELIMINAR_PEDIDO: '¿Estás seguro que deseas eliminar este pedido?',
    CANCELAR_PEDIDO: '¿Estás seguro que deseas cancelar este pedido?',
    ELIMINAR_MESA: '¿Estás seguro que deseas eliminar esta mesa?',
    ELIMINAR_USUARIO: '¿Estás seguro que deseas eliminar este usuario?',
    CERRAR_SESION: '¿Estás seguro que deseas cerrar sesión?',
    PERDER_CAMBIOS: 'Tienes cambios sin guardar. ¿Deseas continuar?',
  },

  // ============================================
  // TÍTULOS
  // ============================================
  TITULOS: {
    // Páginas
    DASHBOARD: 'Panel de Control',
    PEDIDOS: 'Pedidos',
    MESAS: 'Mesas',
    MENU: 'Menú',
    USUARIOS: 'Usuarios',
    ANALYTICS: 'Análisis',
    CONFIGURACION: 'Configuración',
    
    // Modales
    NUEVO_PEDIDO: 'Nuevo Pedido',
    EDITAR_PEDIDO: 'Editar Pedido',
    NUEVA_MESA: 'Nueva Mesa',
    EDITAR_MESA: 'Editar Mesa',
    NUEVO_USUARIO: 'Nuevo Usuario',
    EDITAR_USUARIO: 'Editar Usuario',
  },

  // ============================================
  // VALIDACIONES
  // ============================================
  VALIDACIONES: {
    CAMPO_REQUERIDO: 'Este campo es requerido.',
    EMAIL_INVALIDO: 'El email no es válido.',
    CONTRASENA_CORTA: 'La contraseña debe tener al menos 8 caracteres.',
    NUMERO_INVALIDO: 'Debe ser un número válido.',
    NUMERO_POSITIVO: 'Debe ser un número positivo.',
    FECHA_INVALIDA: 'La fecha no es válida.',
    TELEFONO_INVALIDO: 'El teléfono no es válido.',
  },
};

// ============================================
// HELPERS DE FORMATEO
// ============================================

/**
 * Formatea un monto como moneda argentina
 */
export const formatearMoneda = (monto: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(monto);
};

/**
 * Formatea una fecha en formato corto (dd/MM/yyyy)
 */
export const formatearFecha = (fecha: Date | string): string => {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fechaObj);
};

/**
 * Formatea una fecha y hora completa
 */
export const formatearFechaCompleta = (fecha: Date | string): string => {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(fechaObj);
};

/**
 * Formatea una hora (HH:mm)
 */
export const formatearHora = (fecha: Date | string): string => {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(fechaObj);
};

/**
 * Obtiene el mensaje de error apropiado
 */
export const obtenerMensajeError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return MENSAJES.ERRORES.GENERICO;
};
