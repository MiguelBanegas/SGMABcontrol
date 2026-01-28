import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MigrationPanel.css";

const MigrationPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5051"}/api/migration/migration-status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(response.data.stats);
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
      setError("Error al cargar estadísticas de la base de datos");
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas ejecutar la migración? Este proceso puede tardar varios minutos."
      )
    ) {
      return;
    }

    try {
      setMigrating(true);
      setError(null);
      setResult(null);

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5051"}/api/migration/run-migration`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResult(response.data);
      await loadStats(); // Recargar estadísticas después de la migración
    } catch (err) {
      console.error("Error durante la migración:", err);
      setError(
        err.response?.data?.error || "Error al ejecutar la migración"
      );
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="migration-panel">
      <div className="migration-header">
        <h2>🔄 Migración de Historial de Ventas</h2>
        <p className="migration-subtitle">
          Importa datos desde el backup SQLite a la base de datos actual
        </p>
      </div>

      {/* Estado actual de la base de datos */}
      <div className="stats-section">
        <h3>📊 Estado Actual de la Base de Datos</h3>
        {loading ? (
          <div className="loading">Cargando estadísticas...</div>
        ) : stats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📁</div>
              <div className="stat-value">{stats.categories}</div>
              <div className="stat-label">Categorías</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{stats.products}</div>
              <div className="stat-label">Productos</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{stats.customers}</div>
              <div className="stat-label">Clientes</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">{stats.sales}</div>
              <div className="stat-label">Ventas</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛒</div>
              <div className="stat-value">{stats.saleItems}</div>
              <div className="stat-label">Items de Venta</div>
            </div>
          </div>
        ) : (
          <div className="error-message">
            No se pudieron cargar las estadísticas
          </div>
        )}
      </div>

      {/* Botón de migración */}
      <div className="migration-actions">
        <button
          className="btn-migrate"
          onClick={runMigration}
          disabled={migrating}
        >
          {migrating ? (
            <>
              <span className="spinner"></span>
              Migrando datos...
            </>
          ) : (
            <>
              <span className="icon">▶️</span>
              Ejecutar Migración
            </>
          )}
        </button>
      </div>

      {/* Resultado de la migración */}
      {result && (
        <div className={`result-section ${result.success ? "success" : "error"}`}>
          <h3>{result.success ? "✅ Migración Exitosa" : "❌ Error en Migración"}</h3>
          {result.success && result.stats && (
            <div className="migration-stats">
              <p>
                <strong>Categorías agregadas:</strong> {result.stats.categories.added}
              </p>
              <p>
                <strong>Productos:</strong> {result.stats.products.added} agregados,{" "}
                {result.stats.products.updated} actualizados
              </p>
              <p>
                <strong>Clientes agregados:</strong> {result.stats.customers.added}
              </p>
              <p>
                <strong>Ventas agregadas:</strong> {result.stats.sales.added}
              </p>
              <p>
                <strong>Items de venta agregados:</strong>{" "}
                {result.stats.saleItems.added}
              </p>
              <p>
                <strong>Imágenes copiadas:</strong> {result.stats.images.copied}
              </p>
            </div>
          )}
          {result.message && <p className="result-message">{result.message}</p>}
        </div>
      )}

      {/* Errores */}
      {error && (
        <div className="error-section">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Información adicional */}
      <div className="info-section">
        <h3>ℹ️ Información Importante</h3>
        <ul>
          <li>
            La migración importará clientes, productos, ventas e imágenes desde el
            backup SQLite
          </li>
          <li>
            Los productos existentes se actualizarán con los precios y stock del
            backup
          </li>
          <li>
            Los clientes y ventas nuevos se agregarán sin duplicar registros
            existentes
          </li>
          <li>El proceso puede tardar varios minutos dependiendo del tamaño del backup</li>
          <li>
            <strong>Recomendación:</strong> Realiza un backup de la base de datos
            actual antes de ejecutar la migración
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MigrationPanel;
