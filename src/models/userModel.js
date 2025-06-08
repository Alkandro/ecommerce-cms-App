// /home/ubuntu/ecommerce_app/models/userModel.js
// Modelo de perfil de usuario
export const userProfileModel = {
    // Información básica (visible en SettingsScreen)
    displayName: "", // Nombre completo del usuario
    email: "", // Email (vinculado con Auth)
    phoneNumber: "", // Número de teléfono
    photoURL: "", // URL de la foto de perfil
    
    // Información personal adicional
    firstName: "", // Nombre
    lastName: "", // Apellido
    birthDate: null, // Fecha de nacimiento (timestamp)
    gender: "", // Género (opcional)
    
    // Metadatos
    createdAt: null, // Timestamp de creación
    updatedAt: null, // Timestamp de última actualización
    role: "customer", // Rol: customer, admin, etc.
    isActive: true, // Estado de la cuenta
  };
  
  // Modelo de dirección de envío
  export const userAddressModel = {
    userId: "", // Referencia al usuario propietario
    alias: "", // Nombre de la dirección (ej: "Casa", "Trabajo")
    fullName: "", // Nombre completo del destinatario
    phoneNumber: "", // Teléfono de contacto
    
    // Detalles de la dirección
    street: "", // Calle y número
    apartment: "", // Apartamento, suite, etc. (opcional)
    city: "", // Ciudad
    state: "", // Estado/Provincia
    zipCode: "", // Código postal
    country: "", // País
    
    // Coordenadas (opcional, para mapas)
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    
    // Metadatos
    isDefault: false, // Si es la dirección predeterminada
    createdAt: null, // Timestamp de creación
    updatedAt: null, // Timestamp de última actualización
  };
  
  // Modelo de método de pago (referencia segura)
  export const userPaymentMethodModel = {
    userId: "", // Referencia al usuario propietario
    type: "", // Tipo: credit_card, debit_card, paypal, etc.
    
    // Información segura (solo referencias o información parcial)
    lastFourDigits: "", // Últimos 4 dígitos (para tarjetas)
    cardBrand: "", // Marca de la tarjeta (Visa, Mastercard, etc.)
    
    // Información de facturación
    billingAddressId: "", // Referencia a la dirección de facturación
    
    // Metadatos
    isDefault: false, // Si es el método predeterminado
    createdAt: null, // Timestamp de creación
    updatedAt: null, // Timestamp de última actualización
    expiryDate: null, // Fecha de expiración (para tarjetas)
  };
  
  // Modelo de notificaciones
  export const userNotificationSettingsModel = {
    userId: "", // Referencia al usuario propietario
    
    // Preferencias de notificaciones
    emailNotifications: true, // Recibir notificaciones por email
    pushNotifications: true, // Recibir notificaciones push
    smsNotifications: false, // Recibir notificaciones SMS
    
    // Tipos de notificaciones
    orderUpdates: true, // Actualizaciones de pedidos
    promotions: true, // Promociones y ofertas
    newProducts: true, // Nuevos productos
    
    // Metadatos
    updatedAt: null, // Timestamp de última actualización
  };
  
  /**
   * Función para crear un nuevo perfil de usuario
   * @param {string} uid - UID de Firebase Auth
   * @param {string} email - Email del usuario
   * @param {string} displayName - Nombre completo (opcional)
   * @returns {Object} Objeto de perfil de usuario
   */
  export const createUserProfile = (uid, email, displayName = "") => {
    const now = new Date();
    
    return {
      uid,
      ...userProfileModel,
      email,
      displayName: displayName || "",
      createdAt: now,
      updatedAt: now,
    };
  };
  
  /**
   * Función para crear una nueva dirección de envío
   * @param {string} userId - UID del usuario propietario
   * @param {Object} addressData - Datos de la dirección
   * @returns {Object} Objeto de dirección de envío
   */
  export const createUserAddress = (userId, addressData = {}) => {
    const now = new Date();
    
    return {
      ...userAddressModel,
      userId,
      ...addressData,
      createdAt: now,
      updatedAt: now,
    };
  };
  
  /**
   * Función para crear un nuevo método de pago
   * @param {string} userId - UID del usuario propietario
   * @param {Object} paymentData - Datos del método de pago
   * @returns {Object} Objeto de método de pago
   */
  export const createUserPaymentMethod = (userId, paymentData = {}) => {
    const now = new Date();
    
    return {
      ...userPaymentMethodModel,
      userId,
      ...paymentData,
      createdAt: now,
      updatedAt: now,
    };
  };
  
  /**
   * Función para crear configuración de notificaciones
   * @param {string} userId - UID del usuario propietario
   * @returns {Object} Objeto de configuración de notificaciones
   */
  export const createNotificationSettings = (userId) => {
    const now = new Date();
    
    return {
      ...userNotificationSettingsModel,
      userId,
      updatedAt: now,
    };
  };
  