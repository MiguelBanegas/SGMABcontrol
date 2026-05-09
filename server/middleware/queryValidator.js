/**
 * MIDDLEWARE: Validación de Query Parameters
 * Previene SQL Injection mediante validación explícita
 * 
 * Uso:
 * router.get('/endpoint', validateQueryParams({...validators}), controller);
 */

/**
 * Validadores reutilizables
 */
const validators = {
  // Valida formato de fecha ISO (YYYY-MM-DD)
  date: (value) => {
    if (!value) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
  },

  // Valida string (máximo 100 caracteres)
  string: (value, maxLength = 100) => {
    return typeof value === "string" && value.length > 0 && value.length <= maxLength;
  },

  // Valida que esté en lista permitida
  enum: (allowedValues) => (value) => {
    if (!value) return true;
    return allowedValues.includes(value);
  },

  // Valida entero positivo
  positiveInt: (value) => {
    if (!value) return true;
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0 && num === parseInt(value, 10);
  },

  // Valida UUID
  uuid: (value) => {
    if (!value) return true;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  },

  // Valida email
  email: (value) => {
    if (!value) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  // Valida que no contenga caracteres peligrosos
  safe: (value) => {
    if (!value) return true;
    // Evita: ', ", ;, --, /*, */, xp_, sp_, etc.
    const dangerous = /['";]|--|\/\*|\*\/|xp_|sp_/gi;
    return !dangerous.test(value);
  },
};

/**
 * Middleware de validación
 * @param {Object} rules - Reglas de validación por parámetro
 * @returns {Function} Middleware
 * 
 * Ejemplo:
 * {
 *   seller: validators.string,
 *   date: validators.date,
 *   payment: validators.enum(['cash', 'card', 'check']),
 *   limit: validators.positiveInt
 * }
 */
const validateQueryParams = (rules) => {
  return (req, res, next) => {
    const errors = [];

    for (const [param, validator] of Object.entries(rules)) {
      const value = req.query[param];

      if (value !== undefined && !validator(value)) {
        errors.push({
          param,
          value: value.substring(0, 50), // Truncar para logging
          message: `Parámetro inválido: ${param}`,
        });
      }
    }

    if (errors.length > 0) {
      console.warn("[QUERY VALIDATION FAILED]", {
        ip: req.ip,
        params: req.query,
        errors,
      });

      return res.status(400).json({
        code: "INVALID_QUERY_PARAMS",
        message: "Parámetros de búsqueda inválidos",
        errors: errors.map((e) => ({ param: e.param, message: e.message })),
      });
    }

    next();
  };
};

/**
 * Middleware para sanitizar strings de búsqueda
 * Escapa caracteres especiales de SQL
 */
const sanitizeSearchParams = () => {
  return (req, res, next) => {
    const searchParams = ["q", "search", "seller", "customer", "name"];

    for (const param of searchParams) {
      if (req.query[param]) {
        // Escapar caracteres especiales de LIKE
        req.query[param] = req.query[param]
          .replace(/\\/g, "\\\\") // Escapar backslash primero
          .replace(/%/g, "\\%") // Escapar %
          .replace(/_/g, "\\_"); // Escapar _
      }
    }

    next();
  };
};

/**
 * Middleware para loguear queries sospechosas
 */
const logSuspiciousQueries = () => {
  return (req, res, next) => {
    const suspiciousPatterns = [
      /['";]|--/gi, // SQL comments/quotes
      /(union|select|insert|update|delete|drop|create|alter)/gi, // SQL keywords
      /(xp_|sp_)/gi, // Stored procedures
      /(\*|\/)/gi, // Comments
    ];

    let isSuspicious = false;
    let matchedPatterns = [];

    const queryString = JSON.stringify(req.query);

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(queryString)) {
        isSuspicious = true;
        matchedPatterns.push(pattern.toString());
      }
    }

    if (isSuspicious) {
      console.warn("[SUSPICIOUS QUERY DETECTED]", {
        ip: req.ip,
        url: req.originalUrl,
        query: req.query,
        patterns: matchedPatterns,
      });

      // Opcionalmente, rechazar
      // return res.status(403).json({ message: "Consulta sospechosa" });
    }

    next();
  };
};

module.exports = {
  validateQueryParams,
  sanitizeSearchParams,
  logSuspiciousQueries,
  validators,
};
