import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import {
  obtenerEmpresa,
  crearEmpresa,
  actualizarEmpresa,
  obtenerParametrosSunat,
  crearParametrosSunat,
  actualizarParametrosSunat,
  listarSeries,
  crearSerie,
  actualizarSerie
} from "../services/sunatBase.service";

const initialEmpresa = {
  ruc: "",
  razon_social: "",
  nombre_comercial: "",
  direccion_fiscal: "",
  ubigeo: "",
  departamento: "",
  provincia: "",
  distrito: ""
};

const initialParametros = {
  id_empresa: "",
  ambiente: "beta",
  usuario_sol: "",
  clave_sol: "",
  certificado_ruta: "",
  certificado_password: "",
  endpoint_factura: "",
  endpoint_guia: "",
  endpoint_consulta: ""
};

const initialSerie = {
  id_empresa: "",
  tipo_comprobante: "03",
  serie: "",
  correlativo_actual: 0
};

const tiposComprobante = {
  "01": "Factura",
  "03": "Boleta",
  "07": "Nota de crédito",
  "08": "Nota de débito"
};

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState("empresa");

  const [empresa, setEmpresa] = useState(null);
  const [parametros, setParametros] = useState(null);
  const [series, setSeries] = useState([]);

  const [empresaForm, setEmpresaForm] = useState(initialEmpresa);
  const [parametrosForm, setParametrosForm] = useState(initialParametros);
  const [serieForm, setSerieForm] = useState(initialSerie);

  const [seriePanelOpen, setSeriePanelOpen] = useState(false);
  const [editSerieId, setEditSerieId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

    const cargarDatos = async () => {
    try {
        setLoading(true);

        const [empresaRes, parametrosRes, seriesRes] = await Promise.allSettled([
        obtenerEmpresa(),
        obtenerParametrosSunat(),
        listarSeries()
        ]);

        if (empresaRes.status === "fulfilled" && empresaRes.value.ok) {
        const empresaData = empresaRes.value.data;

        setEmpresa(empresaData);

        setEmpresaForm({
            ruc: empresaData.ruc || "",
            razon_social: empresaData.razon_social || "",
            nombre_comercial: empresaData.nombre_comercial || "",
            direccion_fiscal: empresaData.direccion_fiscal || "",
            ubigeo: empresaData.ubigeo || "",
            departamento: empresaData.departamento || "",
            provincia: empresaData.provincia || "",
            distrito: empresaData.distrito || ""
        });

        setParametrosForm((prev) => ({
            ...prev,
            id_empresa: empresaData.id_empresa
        }));

        setSerieForm((prev) => ({
            ...prev,
            id_empresa: empresaData.id_empresa
        }));
        } else {
        setEmpresa(null);
        setEmpresaForm(initialEmpresa);
        }

        if (parametrosRes.status === "fulfilled" && parametrosRes.value.ok) {
        const parametrosData = parametrosRes.value.data;

        setParametros(parametrosData);

        setParametrosForm({
            id_empresa: parametrosData.id_empresa || "",
            ambiente: parametrosData.ambiente || "beta",
            usuario_sol: parametrosData.usuario_sol || "",
            clave_sol: parametrosData.clave_sol || "",
            certificado_ruta: parametrosData.certificado_ruta || "",
            certificado_password: parametrosData.certificado_password || "",
            endpoint_factura: parametrosData.endpoint_factura || "",
            endpoint_guia: parametrosData.endpoint_guia || "",
            endpoint_consulta: parametrosData.endpoint_consulta || ""
        });
        } else {
        setParametros(null);
        }

        if (seriesRes.status === "fulfilled" && seriesRes.value.ok) {
        setSeries(seriesRes.value.data);
        } else {
        setSeries([]);
        }
    } catch (error) {
        Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo cargar la configuración",
        "error"
        );
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleEmpresaChange = (event) => {
    setEmpresaForm({
      ...empresaForm,
      [event.target.name]: event.target.value
    });
  };

  const handleParametrosChange = (event) => {
    setParametrosForm({
      ...parametrosForm,
      [event.target.name]: event.target.value
    });
  };

  const handleSerieChange = (event) => {
    setSerieForm({
      ...serieForm,
      [event.target.name]: event.target.value
    });
  };

  const validarEmpresa = () => {
    if (!empresaForm.ruc.trim() || empresaForm.ruc.trim().length !== 11) {
      Swal.fire("Validación", "El RUC debe tener 11 dígitos", "warning");
      return false;
    }

    if (!empresaForm.razon_social.trim()) {
      Swal.fire("Validación", "La razón social es obligatoria", "warning");
      return false;
    }

    return true;
  };

  const guardarEmpresa = async (event) => {
    event.preventDefault();

    if (!validarEmpresa()) return;

    const payload = {
      ruc: empresaForm.ruc.trim(),
      razon_social: empresaForm.razon_social.trim(),
      nombre_comercial: empresaForm.nombre_comercial.trim() || null,
      direccion_fiscal: empresaForm.direccion_fiscal.trim() || null,
      ubigeo: empresaForm.ubigeo.trim() || null,
      departamento: empresaForm.departamento.trim() || null,
      provincia: empresaForm.provincia.trim() || null,
      distrito: empresaForm.distrito.trim() || null
    };

    try {
      setGuardando(true);

      const response = empresa?.id_empresa
        ? await actualizarEmpresa(empresa.id_empresa, payload)
        : await crearEmpresa(payload);

      if (response.ok) {
        Swal.fire(
          "Guardado",
          "Los datos de la empresa fueron guardados correctamente",
          "success"
        );

        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar la empresa",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const validarParametros = () => {
    if (!empresa?.id_empresa && !parametrosForm.id_empresa) {
      Swal.fire("Validación", "Primero debe registrar la empresa", "warning");
      return false;
    }

    if (!parametrosForm.ambiente) {
      Swal.fire("Validación", "Seleccione el ambiente SUNAT", "warning");
      return false;
    }

    if (!parametrosForm.usuario_sol.trim()) {
      Swal.fire("Validación", "El usuario SOL es obligatorio", "warning");
      return false;
    }

    if (!parametrosForm.clave_sol.trim()) {
      Swal.fire("Validación", "La clave SOL es obligatoria", "warning");
      return false;
    }

    return true;
  };

  const guardarParametros = async (event) => {
    event.preventDefault();

    if (!validarParametros()) return;

    const payload = {
      id_empresa: Number(empresa?.id_empresa || parametrosForm.id_empresa),
      ambiente: parametrosForm.ambiente,
      usuario_sol: parametrosForm.usuario_sol.trim(),
      clave_sol: parametrosForm.clave_sol.trim(),
      certificado_ruta: parametrosForm.certificado_ruta.trim() || null,
      certificado_password: parametrosForm.certificado_password.trim() || null,
      endpoint_factura: parametrosForm.endpoint_factura.trim() || null,
      endpoint_guia: parametrosForm.endpoint_guia.trim() || null,
      endpoint_consulta: parametrosForm.endpoint_consulta.trim() || null
    };

    try {
      setGuardando(true);

      const response = parametros?.id_parametro_sunat
        ? await actualizarParametrosSunat(parametros.id_parametro_sunat, payload)
        : await crearParametrosSunat(payload);

      if (response.ok) {
        Swal.fire(
          "Guardado",
          "Los parámetros SUNAT fueron guardados correctamente",
          "success"
        );

        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar los parámetros SUNAT",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirNuevaSerie = () => {
    setEditSerieId(null);
    setSerieForm({
      ...initialSerie,
      id_empresa: empresa?.id_empresa || ""
    });
    setSeriePanelOpen(true);
  };

  const abrirEditarSerie = (serie) => {
    setEditSerieId(serie.id_serie);
    setSerieForm({
      id_empresa: serie.id_empresa || empresa?.id_empresa || "",
      tipo_comprobante: serie.tipo_comprobante || "03",
      serie: serie.serie || "",
      correlativo_actual: serie.correlativo_actual ?? 0
    });
    setSeriePanelOpen(true);
  };

  const cerrarSeriePanel = () => {
    setEditSerieId(null);
    setSerieForm(initialSerie);
    setSeriePanelOpen(false);
  };

  const validarSerie = () => {
    if (!empresa?.id_empresa && !serieForm.id_empresa) {
      Swal.fire("Validación", "Primero debe registrar la empresa", "warning");
      return false;
    }

    if (!serieForm.tipo_comprobante) {
      Swal.fire("Validación", "Seleccione el tipo de comprobante", "warning");
      return false;
    }

    if (!serieForm.serie.trim() || serieForm.serie.trim().length !== 4) {
      Swal.fire("Validación", "La serie debe tener 4 caracteres", "warning");
      return false;
    }

    const serie = serieForm.serie.trim().toUpperCase();

    if (serieForm.tipo_comprobante === "01" && !serie.startsWith("F")) {
      Swal.fire("Validación", "La serie de factura debe iniciar con F", "warning");
      return false;
    }

    if (serieForm.tipo_comprobante === "03" && !serie.startsWith("B")) {
      Swal.fire("Validación", "La serie de boleta debe iniciar con B", "warning");
      return false;
    }

    if (Number(serieForm.correlativo_actual) < 0) {
      Swal.fire("Validación", "El correlativo no puede ser negativo", "warning");
      return false;
    }

    return true;
  };

  const guardarSerie = async (event) => {
    event.preventDefault();

    if (!validarSerie()) return;

    const payload = {
      id_empresa: Number(empresa?.id_empresa || serieForm.id_empresa),
      tipo_comprobante: serieForm.tipo_comprobante,
      serie: serieForm.serie.trim().toUpperCase(),
      correlativo_actual: Number(serieForm.correlativo_actual || 0)
    };

    try {
      setGuardando(true);

      const response = editSerieId
        ? await actualizarSerie(editSerieId, payload)
        : await crearSerie(payload);

      if (response.ok) {
        Swal.fire(
          editSerieId ? "Serie actualizada" : "Serie creada",
          "La serie fue guardada correctamente",
          "success"
        );

        cerrarSeriePanel();
        cargarDatos();
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "No se pudo guardar la serie",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const badgeAmbiente = (ambiente) => {
    if (ambiente === "produccion") return "status-badge status-active";
    return "status-badge status-warning";
  };

  if (loading) {
    return <p>Cargando configuración...</p>;
  }

  return (
    <div className="configuracion-page">
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p>
            Administre los datos de empresa, parámetros SUNAT y series de
            comprobantes.
          </p>
        </div>

        <button className="btn-secondary" onClick={cargarDatos}>
          Actualizar
        </button>
      </div>

      <div className="catalog-tabs">
        <button
          className={activeTab === "empresa" ? "active" : ""}
          onClick={() => setActiveTab("empresa")}
        >
          Empresa
        </button>

        <button
          className={activeTab === "sunat" ? "active" : ""}
          onClick={() => setActiveTab("sunat")}
        >
          Parámetros SUNAT
        </button>

        <button
          className={activeTab === "series" ? "active" : ""}
          onClick={() => setActiveTab("series")}
        >
          Series
        </button>
      </div>

      {activeTab === "empresa" && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Datos de la empresa</h2>
              <p>
                Esta información se usará para comprobantes, reportes y emisión
                electrónica.
              </p>
            </div>

            {empresa && (
              <span className="status-badge status-active">
                Empresa configurada
              </span>
            )}
          </div>

          <form className="drawer-form" onSubmit={guardarEmpresa}>
            <div className="form-group">
              <label>RUC</label>
              <input
                type="text"
                name="ruc"
                value={empresaForm.ruc}
                onChange={handleEmpresaChange}
                maxLength="11"
                placeholder="Ingrese RUC"
              />
            </div>

            <div className="form-group">
              <label>Razón social</label>
              <input
                type="text"
                name="razon_social"
                value={empresaForm.razon_social}
                onChange={handleEmpresaChange}
                placeholder="Razón social"
              />
            </div>

            <div className="form-group">
              <label>Nombre comercial</label>
              <input
                type="text"
                name="nombre_comercial"
                value={empresaForm.nombre_comercial}
                onChange={handleEmpresaChange}
                placeholder="Nombre comercial"
              />
            </div>

            <div className="form-group">
              <label>Dirección fiscal</label>
              <input
                type="text"
                name="direccion_fiscal"
                value={empresaForm.direccion_fiscal}
                onChange={handleEmpresaChange}
                placeholder="Dirección fiscal"
              />
            </div>

            <div className="form-group">
              <label>Ubigeo</label>
              <input
                type="text"
                name="ubigeo"
                value={empresaForm.ubigeo}
                onChange={handleEmpresaChange}
                placeholder="Ej. 040101"
              />
            </div>

            <div className="form-group">
              <label>Departamento</label>
              <input
                type="text"
                name="departamento"
                value={empresaForm.departamento}
                onChange={handleEmpresaChange}
                placeholder="Ej. Arequipa"
              />
            </div>

            <div className="form-group">
              <label>Provincia</label>
              <input
                type="text"
                name="provincia"
                value={empresaForm.provincia}
                onChange={handleEmpresaChange}
                placeholder="Ej. Arequipa"
              />
            </div>

            <div className="form-group">
              <label>Distrito</label>
              <input
                type="text"
                name="distrito"
                value={empresaForm.distrito}
                onChange={handleEmpresaChange}
                placeholder="Ej. Cercado"
              />
            </div>

            <div className="drawer-actions form-full">
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando
                  ? "Guardando..."
                  : empresa
                  ? "Actualizar empresa"
                  : "Crear empresa"}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === "sunat" && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Parámetros SUNAT</h2>
              <p>
                Configure credenciales SOL, ambiente, endpoints y certificado
                digital.
              </p>
            </div>

            {parametros && (
              <span className={badgeAmbiente(parametros.ambiente)}>
                {parametros.ambiente}
              </span>
            )}
          </div>

          {!empresa && (
            <p>
              Primero registre los datos de la empresa para poder configurar
              parámetros SUNAT.
            </p>
          )}

          <form className="drawer-form" onSubmit={guardarParametros}>
            <div className="form-group">
              <label>Empresa</label>
              <input
                type="text"
                value={
                  empresa
                    ? `${empresa.ruc} - ${empresa.razon_social}`
                    : "Empresa no configurada"
                }
                disabled
              />
            </div>

            <div className="form-group">
              <label>Ambiente</label>
              <select
                name="ambiente"
                value={parametrosForm.ambiente}
                onChange={handleParametrosChange}
              >
                <option value="beta">Beta</option>
                <option value="produccion">Producción</option>
              </select>
            </div>

            <div className="form-group">
              <label>Usuario SOL</label>
              <input
                type="text"
                name="usuario_sol"
                value={parametrosForm.usuario_sol}
                onChange={handleParametrosChange}
                placeholder="Usuario SOL"
              />
            </div>

            <div className="form-group">
              <label>Clave SOL</label>
              <input
                type="password"
                name="clave_sol"
                value={parametrosForm.clave_sol}
                onChange={handleParametrosChange}
                placeholder="Clave SOL"
              />
            </div>

            <div className="form-group">
              <label>Ruta certificado PFX</label>
              <input
                type="text"
                name="certificado_ruta"
                value={parametrosForm.certificado_ruta}
                onChange={handleParametrosChange}
                placeholder="storage/certificados/certificado.pfx"
              />
            </div>

            <div className="form-group">
              <label>Contraseña certificado</label>
              <input
                type="password"
                name="certificado_password"
                value={parametrosForm.certificado_password}
                onChange={handleParametrosChange}
                placeholder="Contraseña del certificado"
              />
            </div>

            <div className="form-group">
              <label>Endpoint factura</label>
              <input
                type="text"
                name="endpoint_factura"
                value={parametrosForm.endpoint_factura}
                onChange={handleParametrosChange}
                placeholder="URL del servicio factura"
              />
            </div>

            <div className="form-group">
              <label>Endpoint guía</label>
              <input
                type="text"
                name="endpoint_guia"
                value={parametrosForm.endpoint_guia}
                onChange={handleParametrosChange}
                placeholder="URL del servicio guía"
              />
            </div>

            <div className="form-group">
              <label>Endpoint consulta</label>
              <input
                type="text"
                name="endpoint_consulta"
                value={parametrosForm.endpoint_consulta}
                onChange={handleParametrosChange}
                placeholder="URL del servicio consulta"
              />
            </div>

            <div className="drawer-actions form-full">
              <button
                type="submit"
                className="btn-primary"
                disabled={guardando || !empresa}
              >
                {guardando
                  ? "Guardando..."
                  : parametros
                  ? "Actualizar parámetros"
                  : "Crear parámetros"}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === "series" && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Series de comprobantes</h2>
              <p>
                Configure las series y correlativos para factura, boleta y notas.
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={abrirNuevaSerie}
              disabled={!empresa}
            >
              + Nueva serie
            </button>
          </div>

          {!empresa && (
            <p>
              Primero registre los datos de la empresa para poder crear series.
            </p>
          )}

          {series.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Empresa</th>
                    <th>Tipo comprobante</th>
                    <th>Serie</th>
                    <th>Correlativo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {series.map((serie) => (
                    <tr key={serie.id_serie}>
                      <td>#{serie.id_serie}</td>
                      <td>
                        <strong>{serie.razon_social}</strong>
                        <br />
                        <small>RUC: {serie.ruc}</small>
                      </td>
                      <td>
                        {tiposComprobante[serie.tipo_comprobante] ||
                          serie.tipo_comprobante}
                      </td>
                      <td>{serie.serie}</td>
                      <td>{serie.correlativo_actual}</td>
                      <td>
                        <button
                          className="btn-small"
                          onClick={() => abrirEditarSerie(serie)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No hay series registradas.</p>
          )}
        </section>
      )}

      {seriePanelOpen && (
        <>
          <div className="drawer-overlay" onClick={cerrarSeriePanel} />

          <aside className="drawer-panel">
            <div className="drawer-header">
              <div>
                <h2>{editSerieId ? "Editar serie" : "Nueva serie"}</h2>
                <p>Configure la serie y correlativo del comprobante.</p>
              </div>

              <button className="drawer-close" onClick={cerrarSeriePanel}>
                ×
              </button>
            </div>

            <form className="drawer-form" onSubmit={guardarSerie}>
              <div className="form-group">
                <label>Empresa</label>
                <input
                  type="text"
                  value={
                    empresa
                      ? `${empresa.ruc} - ${empresa.razon_social}`
                      : "Empresa no configurada"
                  }
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Tipo comprobante</label>
                <select
                  name="tipo_comprobante"
                  value={serieForm.tipo_comprobante}
                  onChange={handleSerieChange}
                >
                  <option value="01">Factura</option>
                  <option value="03">Boleta</option>
                  <option value="07">Nota de crédito</option>
                  <option value="08">Nota de débito</option>
                </select>
              </div>

              <div className="form-group">
                <label>Serie</label>
                <input
                  type="text"
                  name="serie"
                  value={serieForm.serie}
                  onChange={handleSerieChange}
                  maxLength="4"
                  placeholder="Ej. F001 / B001"
                />
              </div>

              <div className="form-group">
                <label>Correlativo actual</label>
                <input
                  type="number"
                  name="correlativo_actual"
                  value={serieForm.correlativo_actual}
                  onChange={handleSerieChange}
                  min="0"
                />
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarSeriePanel}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : editSerieId
                    ? "Guardar cambios"
                    : "Crear serie"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
};

export default Configuracion;