import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Menu from '../components/MenuSandwich';
import './Documentos.css';
import Modal from 'react-modal';

interface Documento {
  idPiloto: number;
  titulo: string;
  temas: string;
  archivos: string;
  estado: string;
}

Modal.setAppElement('#root');

const Documentos: React.FC = () => {
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<Documento | null>(null);
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoTemas, setNuevoTemas] = useState('');
  const [nuevosArchivos, setNuevosArchivos] = useState<File[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [tituloEditado, setTituloEditado] = useState('');
  const [temasEditados, setTemasEditados] = useState('');
  const [archivosCombinados, setArchivosCombinados] = useState<any[]>([]);
  const [idsEliminados, setIdsEliminados] = useState<number[]>([]);
  const [documentosDetalle, setDocumentosDetalle] = useState<any[]>([]);
  const [documentosSeleccionados, setDocumentosSeleccionados] = useState<string[]>([]);

  const location = useLocation();
  const tamanioPagina = 3;

    useEffect(() => {
      obtenerDocumentos();
    }, [paginaActual, busqueda]);
    
    const obtenerDocumentos = async () => {
      setCargando(true);
      try {
        const respuesta = await fetch(`https://pilotoiabackendapis-ctfgcmc9hwdja4d6.canadacentral-01.azurewebsites.net/api/ArchivoPiloto/listar?TamanioPagina=${tamanioPagina}&NumeroPagina=${paginaActual}&Filtro=${busqueda}`);
        const datos = await respuesta.json();
        setDocumentos(datos.result.lista || []);
        const total = datos.result.totalFilas || 0;
        setTotalPaginas(Math.ceil(total / tamanioPagina));

      } catch (err: any) {
        setError(err.message || 'Error al obtener documentos');
      } finally {
        setCargando(false);
      }
    };

  useEffect(() => {
  if (documentoSeleccionado) {
    setTituloEditado(documentoSeleccionado.titulo);
    setTemasEditados(documentoSeleccionado.temas);
    setArchivosNuevos([]);
    setIdsEliminados([]);

    const actuales = JSON.parse(documentoSeleccionado.archivos || '[]') || [];
    const actualesFormateados = actuales.map((a: any) => ({
      NombreArchivo: a.NombreArchivo,
      RutaArchivo: a.RutaArchivo,
      IdArchivo: a.IdArchivo,
      esNuevo: false
    }));

    setArchivosCombinados(actualesFormateados);
  }
}, [documentoSeleccionado]);

  useEffect(() => {
    const fetchDocumentos = async () => {
      const params = new URLSearchParams(location.search);
      const docs = params.get('docs');
      if (docs) {
        const nombres = decodeURIComponent(docs).split(',');
        setDocumentosSeleccionados(nombres);

        try {
          const response = await fetch(
            `https://pilotoiabackendapis-ctfgcmc9hwdja4d6.canadacentral-01.azurewebsites.net/api/ArchivoPiloto/listar?TamanioPagina=100&NumeroPagina=1&Filtro=`
          );
          const data = await response.json();
          const todos = data.result.lista || [];

          const seleccionados = todos.filter((doc: any) =>
            nombres.includes(doc.titulo)
          );
          setDocumentosDetalle(seleccionados);
        } catch (error) {
          console.error('Error al obtener documentos:', error);
        }
      }
    };

    fetchDocumentos();
  }, [location.search]);

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaginaActual(1);
    await obtenerDocumentos();
  };

 const abrirModal = (doc: Documento) => {
  setDocumentoSeleccionado(doc);
  setArchivosNuevos([]);
  setIdsEliminados([]);

  // Extrae y formatea los archivos registrados
  const actuales = JSON.parse(doc.archivos || '[]') || [];

  const actualesFormateados = actuales.map((a: any) => ({
    NombreArchivo: a.NombreArchivo,
    RutaArchivo: a.RutaArchivo,
    IdArchivo: a.IdArchivo,
    esNuevo: false
  }));

  setArchivosCombinados(actualesFormateados);
  setModalAbierto(true);
};


  const cerrarModal = () => {
    setModalAbierto(false);
  };

  const manejarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    const nuevos = Array.from(e.target.files);
    setArchivosNuevos(prev => [...prev, ...nuevos]);

    const nuevosFormateados = nuevos.map(file => ({
      NombreArchivo: file.name,
      Archivo: '', // aún no convertido
      esNuevo: true,
      file: file
    }));

    setArchivosCombinados(prev => [...prev, ...nuevosFormateados]);
  }
};


const convertirArchivosABase64ConNombre = (archivos: File[]) => {
  const promesas = archivos.map(file => {
    return new Promise<{ nombre: string; base64: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]; // quitamos el encabezado
        resolve({ nombre: file.name, base64 });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });

  return Promise.all(promesas);
};

const guardarCambios = async () => {
  try {
    const nuevosArchivosBase64 = await convertirArchivosABase64ConNombre(archivosNuevos);
    const nuevosFormateados = nuevosArchivosBase64.map(a => ({
      nombre: a.nombre,
      base64: a.base64
    }));

    const body = {
      usuario: "admin",
      idPiloto: documentoSeleccionado?.idPiloto,
      titulo: tituloEditado,
      temas: temasEditados,
      nuevosArchivos: nuevosFormateados,
      idsArchivosEliminados: idsEliminados
    };

    const response = await fetch("https://pilotoiabackendapis-ctfgcmc9hwdja4d6.canadacentral-01.azurewebsites.net/api/ArchivoPiloto/editar", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error("Error al guardar los cambios");

    alert("Documento actualizado con éxito");
    cerrarModal();
    obtenerDocumentos();
  } catch (error) {
    alert("Ocurrió un error al guardar: " + (error as any).message);
  }
};

const guardarNuevoDocumento = async () => {
  try {
    if (!nuevoTitulo.trim() || !nuevoTemas.trim()) {
      alert("Por favor completa todos los campos");
      return;
    }

    const archivosBase64 = await convertirArchivosABase64ConNombre(nuevosArchivos);

    const body = {
      titulo: nuevoTitulo,
      temas: nuevoTemas,
      archivos: archivosBase64
    };

    console.log("Enviando a la API:", body); // 👀 Muestra lo que se envía

    const response = await fetch("https://pilotoiabackendapis-ctfgcmc9hwdja4d6.canadacentral-01.azurewebsites.net/api/ArchivoPiloto/registrar", { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error("Error al guardar el nuevo documento");

    alert("Documento creado con éxito");
    setModalNuevoAbierto(false);
    setNuevoTitulo('');
    setNuevoTemas('');
    setNuevosArchivos([]);
    obtenerDocumentos();
  } catch (error) {
    alert("Error al crear documento: " + (error as any).message);
  }
};

const eliminarArchivo = (index: number) => {
  const archivo = archivosCombinados[index];

  if (!archivo.esNuevo && archivo.IdArchivo) {
    setIdsEliminados(prev => [...prev, archivo.IdArchivo]);
  }

  const nuevos = [...archivosCombinados];
  nuevos.splice(index, 1);
  setArchivosCombinados(nuevos);

  if (archivo.esNuevo) {
    setArchivosNuevos(prev => prev.filter(f => f.name !== archivo.NombreArchivo));
  }
};


  return (
    <div className="contenido-documentos">
      <img
        src="https://staffing.fractal.com.pe/img/fractal-logo.png"
        className="fractal"
        alt="Logo Fractal"
      />
      <Menu />

      <div className="contenedor-formulario">
        <form className="busqueda-formulario" onSubmit={manejarSubmit}>
          <input
            type="text"
            placeholder="Buscar documento..."
            value={busqueda}
            onChange={manejarCambio}
            className="busqueda-input"
          />
          <button type="submit" className="busqueda-boton">
            Buscar
          </button>
        </form>
      </div>
      <div className='boton-nuevoRegistro'>
        <button className="boton-nuevo" onClick={() => setModalNuevoAbierto(true)}>+ nuevo</button>
      </div>
      {cargando && <p>Cargando documentos...</p>}
      {error && <p className="error">{error}</p>}

      {!cargando && (
        <table className="tabla-documentos">
          <thead>
            <tr>
              <th>Id</th>
              <th>Título</th>
              <th>Temas</th>
              <th>Archivos Adjuntos</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {documentos.length > 0 ? (
              documentos.map((doc) => {
                const archivos = JSON.parse(doc.archivos || '[]');
                return (
                  <tr key={doc.idPiloto}>
                    <td
                      onClick={() => abrirModal(doc)}
                      style={{ cursor: 'pointer', color: '#333', fontWeight: 'bold' }}
                    >
                      {doc.idPiloto}
                    </td>
                    <td>
                      <span
                        onClick={() => {
                          const archivos = JSON.parse(doc.archivos || '[]');
                          const nombres = archivos.map((a: any) => a.NombreArchivo);
                          const query = encodeURIComponent(nombres.join(','));
                          window.location.href = `/` + `?docs=${query}`;
                        }}
                        style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                      >
                        {doc.titulo}
                      </span>
                    </td>
                    <td>{doc.temas}</td>
                    <td>
                      {archivos.map((a: any, i: number) => (
                        <span key={i}>
                          <a
                            href={encodeURI(a.RutaArchivo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-archivo"
                          >
                            {a.NombreArchivo}
                          </a>
                          {i < archivos.length - 1 && ', '}
                        </span>
                      ))}
                    </td>
                    <td>{doc.estado}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#777' }}>
                  No se encontraron documentos con ese criterio
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
      )}
      <div className="paginacion">
        <button
          onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaActual === 1}
        >
          &lt;
        </button>

        {[...Array(totalPaginas)].map((_, i) => {
          const pagina = i + 1;
          if (
            pagina === 1 ||
            pagina === totalPaginas ||
            Math.abs(pagina - paginaActual) <= 1
          ) {
            return (
              <button
                key={pagina}
                className={pagina === paginaActual ? 'activo' : ''}
                onClick={() => setPaginaActual(pagina)}
              >
                {pagina}
              </button>
            );
          } else if (
            (pagina === paginaActual - 2 && pagina > 2) ||
            (pagina === paginaActual + 2 && pagina < totalPaginas - 1)
          ) {
            return <span key={pagina}>...</span>;
          }
          return null;
        })}

        <button
          onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
          disabled={paginaActual === totalPaginas}
        >
          &gt;
        </button>
      </div>


    {/* Modal Nuevo */}
    <Modal
      isOpen={modalNuevoAbierto}
      onRequestClose={() => setModalNuevoAbierto(false)}
      contentLabel="Nuevo Documento"
      className="modal-contenido"
      overlayClassName="modal-overlay"
    >
      <div className="modal-cuerpo">
        <button className="boton-cerrar" onClick={() => setModalNuevoAbierto(false)} title="Cerrar">✕</button>

        <h2 className="modal-titulo">Nuevo Documento</h2>

        <div className="fila-formulario">
          <label className="etiqueta">Título:</label>
          <input
            type="text"
            value={nuevoTitulo}
            onChange={(e) => setNuevoTitulo(e.target.value)}
            className="campo-input"
          />
        </div>

        <div className="fila-formulario">
          <label className="etiqueta">Temas:</label>
          <input
            type="text"
            value={nuevoTemas}
            onChange={(e) => setNuevoTemas(e.target.value)}
            className="campo-input"
          />
        </div>

        <div className="fila-formulario">
          <label className="etiqueta">Archivos:</label>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                const nuevos = Array.from(e.target.files);
                setNuevosArchivos(prev => [...prev, ...nuevos]);
              }
            }}
          />
        </div>

        {nuevosArchivos.length > 0 && (
          <div className="archivo-listado" style={{ marginBottom: '1rem' }}>
            <p>Archivos seleccionados:</p>
            <ul>
              {nuevosArchivos.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}


        <div className="boton-editar">
          <button onClick={guardarNuevoDocumento}>Guardar</button>
        </div>
      </div>
    </Modal>

     {/* Modal Editar */}
    <Modal
      isOpen={modalAbierto}
      onRequestClose={cerrarModal}
      contentLabel="Editar Documento"
      className="modal-contenido"
      overlayClassName="modal-overlay"
    >
      {documentoSeleccionado && (
        <div className="modal-cuerpo">
          <button className="boton-cerrar" onClick={cerrarModal} title="Cerrar">✕</button>

          <h2 className="modal-titulo">Editar Documento</h2>

          <div className="fila-formulario">
            <label className="etiqueta">Título:</label>
            <input
              type="text"
              value={tituloEditado}
              onChange={(e) => setTituloEditado(e.target.value)}
              className="campo-input"
            />
          </div>

          <div className="fila-formulario">
            <label className="etiqueta">Temas:</label>
            <input
              type="text"
              value={temasEditados}
              onChange={(e) => setTemasEditados(e.target.value)}
              className="campo-input"
            />
          </div>

          <div className='fila-archivos'>
            <label className="etiqueta">Archivos actuales:</label>
            <ul className="lista-archivos">
              {archivosCombinados.map((a, i) => (
                <li key={i} className="archivo-item">
                  <span className="archivo-nombre">{a.NombreArchivo}</span>                  
                  <button
                    className="boton-eliminar"
                    title="Eliminar archivo"
                    onClick={() => eliminarArchivo(i)}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="cargar-nuevo" onClick={() => document.getElementById('inputArchivo')?.click()}>
              + cargar nuevo
            </div>

            <input
              id="inputArchivo"
              type="file"
              accept="application/pdf"
              multiple
              onChange={manejarArchivos}
              style={{ display: 'none' }}
            />
          </div>

          <div className='boton-editar'>
            <button onClick={guardarCambios}>Guardar</button>
          </div>
        </div>
      )}
    </Modal>



    </div>
  );
};

export default Documentos;
