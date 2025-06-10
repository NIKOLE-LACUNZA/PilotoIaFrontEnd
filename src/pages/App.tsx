import { useEffect,useState } from 'react';
import { useLocation } from 'react-router-dom';
import './App.css'; 
import Menu from '../components/MenuSandwich';

function App() {
  const [consulta, setConsulta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [documentosSeleccionados, setDocumentosSeleccionados] = useState<string[]>([]);
  const [documentosDetalle, setDocumentosDetalle] = useState<any[]>([]);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docs = params.get('docs');
    if (docs) {
      const nombres = decodeURIComponent(docs).split(',');
      setDocumentosSeleccionados(nombres);

      const fetchDocs = async () => {
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
      };

      fetchDocs();
    }
  }, [location.search]);

  const manejarConsulta = async () => {
    setCargando(true);
    setRespuesta('');
    try {
      const res = await fetch('https://pilotoianuevobackend-bbb7fqc0hbd4ccaf.canadacentral-01.azurewebsites.net/api/document/preguntar-grupo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombresDocumentos: documentosSeleccionados,
          pregunta: consulta
        })
      });
      if (!res.ok) {
      const errorTexto = await res.text();
      console.error('Error del servidor:', res.status, errorTexto);
      throw new Error(`Servidor respondió con ${res.status}`);
    }
      const data = await res.json();
      setRespuesta(data.respuesta);
    } catch (error) {
      console.error('Error en consulta:', error);
      setRespuesta('Error al consultar la API');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className='contenido'>
      <img 
        src="https://staffing.fractal.com.pe/img/fractal-logo.png"
        className='fractal'
        alt="Logo Fractal"
      />
      <Menu />
      <section className='izquierda'>
        <div className="titulo-info">
          <h1 className='Titulo'>Piloto IA</h1> 

          {/* INFO para pantallas medianas y pequeñas */}
          <div className="info-container info-mediana">
            <label className="info-label">
              <b>Reglamento de la Ley N° 32069, ley general de contrataciones públicas</b><br />
            </label>
            <a
              href="https://acortar.link/Rtr3wE"
              target="_blank"
              rel="noopener noreferrer"
              className="info-link"
            >
              https://acortar.link/Rtr3wE
            </a>
          </div>
        </div>

        <div className='formulario'>
          <textarea
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Escribe tu consulta"
            className='pregunta'
            disabled={cargando}
          />
          <button onClick={manejarConsulta} className='Boton' disabled={cargando}>
            {cargando ? <div className="spinner"></div> : 'Enviar'}
          </button>
        </div>

        <textarea
          value={respuesta}
          readOnly
          className='respuesta'
        />
      </section>

      <section>
        <img 
          src='https://cdn.agenciasinc.es/var/ezwebin_site/storage/images/_aliases/img_1col/reportajes/las-mentiras-visuales-de-la-ia/11896126-1-esl-MX/Las-mentiras-visuales-de-la-IA.jpg'
          className='imagen'
          alt="Imagen IA"
        />

        {/* INFO para pantallas grandes */}
        <div className="info-container info-grande">
            {documentosDetalle.map((doc) => {
              const archivos = JSON.parse(doc.archivos || '[]');
              return (
                <div key={doc.idPiloto}>
                  <label className="info-label">
                    <b>{doc.titulo}</b><br />
                  </label>
                  {archivos.map((a: any, i: number) => (
                    <a
                      key={i}
                      href={encodeURI(a.RutaArchivo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="info-link"
                    >
                      {a.NombreArchivo}
                    </a>
                  ))}
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}

export default App;
