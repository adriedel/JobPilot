import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminUsers,
  updateUserRole,
  deleteAdminUser,
  getStoredUser,
} from "../services/auth";
import "./AdminPage.css";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function AdminPage() {
  // Beim Öffnen der Seite lesen, nicht beim App-Start – sonst fehlt der
  // User nach einem Login ohne Seiten-Reload.
  const [user] = useState(getStoredUser);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard", { replace: true });
      return;
    }
    loadUsers();
  }, [user, navigate, loadUsers]);

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    setActionError("");
    try {
      await updateUserRole(targetUser.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (targetUser) => {
    if (!window.confirm(`User "${targetUser.email}" wirklich löschen? Alle Bewerbungen werden ebenfalls gelöscht.`)) return;
    setActionError("");
    setDeletingId(targetUser.id);
    try {
      await deleteAdminUser(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const totalBewerbungen = users.reduce((sum, u) => sum + (u.bewerbungen_count || 0), 0);
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="admin-back-btn" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
        <div className="admin-header-title">
          <h1>Admin-Bereich</h1>
          <p>Benutzerverwaltung</p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-number">{users.length}</span>
          <span className="admin-stat-label">Registrierte User</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-number">{adminCount}</span>
          <span className="admin-stat-label">Admins</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-number">{totalBewerbungen}</span>
          <span className="admin-stat-label">Bewerbungen gesamt</span>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {actionError && <div className="admin-error">{actionError}</div>}

      {loading ? (
        <div className="admin-loading">Lade Benutzer…</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>E-Mail</th>
                <th>Rolle</th>
                <th>Registriert</th>
                <th>Verifiziert</th>
                <th>Bewerbungen</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.id === user?.id ? "admin-table-row--self" : ""}>
                  <td data-label="Name">{u.name || <span className="admin-empty">—</span>}</td>
                  <td data-label="E-Mail">{u.email}</td>
                  <td data-label="Rolle">
                    <span className={`admin-role-badge admin-role-badge--${u.role}`}>
                      {u.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td data-label="Registriert">{formatDate(u.created_at)}</td>
                  <td data-label="Verifiziert">
                    {u.email_verified_at ? (
                      <span className="admin-verified">✓</span>
                    ) : (
                      <span className="admin-unverified">✗</span>
                    )}
                  </td>
                  <td data-label="Bewerbungen">{u.bewerbungen_count}</td>
                  <td data-label="Aktionen" className="admin-actions">
                    <button
                      className="admin-btn admin-btn--stats"
                      onClick={() => navigate(`/admin/users/${u.id}/statistik`)}
                      title="Statistik dieses Users anzeigen"
                    >
                      Statistik
                    </button>
                    {u.id !== user?.id ? (
                      <>
                        <button
                          className="admin-btn admin-btn--role"
                          onClick={() => handleRoleToggle(u)}
                          title={u.role === "admin" ? "Zu User degradieren" : "Zum Admin befördern"}
                        >
                          {u.role === "admin" ? "→ User" : "→ Admin"}
                        </button>
                        <button
                          className="admin-btn admin-btn--delete"
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.id}
                          title="User löschen"
                        >
                          {deletingId === u.id ? "…" : "Löschen"}
                        </button>
                      </>
                    ) : (
                      <span className="admin-self-label">Du</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
