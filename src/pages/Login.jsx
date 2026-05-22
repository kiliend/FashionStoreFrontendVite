import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../auth/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    usuario: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.usuario || !form.password) {
      Swal.fire("Campos incompletos", "Ingrese usuario y contraseña", "warning");
      return;
    }

    try {
      setLoading(true);

      await login(form);

      Swal.fire({
        icon: "success",
        title: "Bienvenido",
        text: "Inicio de sesión correcto",
        timer: 1200,
        showConfirmButton: false
      });

      navigate("/dashboard");
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || error.message || "Credenciales incorrectas",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>FashionStore</h1>
        <p>Acceso al sistema administrativo</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              name="usuario"
              value={form.usuario}
              onChange={handleChange}
              placeholder="Ingrese su usuario"
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Ingrese su contraseña"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;