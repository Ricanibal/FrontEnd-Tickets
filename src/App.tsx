import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE = 'http://localhost:8082'

interface Usuario {
  id: number
  nombre: string
  correo: string
  telefono?: string
}

interface Message {
  type: 'success' | 'error' | 'info'
  text: string
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/solicitud" replace />} />
      <Route path="/solicitud" element={<CrearSolicitud />} />
      <Route path="/tickets" element={<ListaTicketsPage />} />
    </Routes>
  )
}

function CrearSolicitud() {
  const [step, setStep] = useState<'usuario' | 'solicitud' | 'gracias'>('usuario')
  const [usuarioCreado, setUsuarioCreado] = useState<Usuario | null>(null)
  const [message, setMessage] = useState<Message | null>(null)

  const showMessage = (type: Message['type'], text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleUsuarioCreado = (usuario: Usuario) => {
    setUsuarioCreado(usuario)
    showMessage('success', 'Usuario creado exitosamente!')
    // Automáticamente pasar al siguiente paso
    setTimeout(() => {
      setStep('solicitud')
    }, 1000)
  }

  return (
    <div className="app-container">
      <div className="container">
        <div className="header-section">
          <div>
            <h1>Sistema de Gestión de Solicitudes</h1>
            <p className="subtitle">gestiona solicitudes con priorización automática</p>
          </div>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {step !== 'gracias' && (
          <div className="step-indicator">
            <div className={`step ${step === 'usuario' ? 'active' : 'completed'}`}>
              <div className="step-number">1</div>
              <div className="step-label">Informacion de contacto</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step === 'solicitud' ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Crear Solicitud</div>
            </div>
          </div>
        )}

        {step === 'usuario' && (
          <FormularioUsuario
            onSuccess={handleUsuarioCreado}
            onError={(error) => showMessage('error', error)}
          />
        )}

        {step === 'solicitud' && usuarioCreado && (
          <FormularioSolicitud
            usuario={usuarioCreado}
            onSuccess={() => {
              setStep('gracias')
            }}
            onError={(error) => showMessage('error', error)}
            onBack={() => setStep('usuario')}
          />
        )}

        {step === 'gracias' && (
          <PantallaGracias
            onVolverInicio={() => {
              setStep('usuario')
              setUsuarioCreado(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function ListaTicketsPage() {
  const navigate = useNavigate()

  return (
    <div className="app-container">
      <div className="container">
        <div className="header-section">
          <div>
            <h1>Gestión de Tickets</h1>
            <p className="subtitle">Lista de tickets ordenados por prioridad</p>
          </div>
          <button 
            onClick={() => navigate('/solicitud')} 
            className="btn-view-tickets"
          >
            Crear Solicitud
          </button>
        </div>
        <ListaTickets
          onCrearNuevo={() => {
            navigate('/solicitud')
          }}
        />
      </div>
    </div>
  )
}

interface FormularioUsuarioProps {
  onSuccess: (usuario: Usuario) => void
  onError: (error: string) => void
}

function FormularioUsuario({ onSuccess, onError }: FormularioUsuarioProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess(data)
        setFormData({ nombre: '', correo: '', telefono: '' })
      } else {
        onError(data.message || 'Error al crear usuario')
      }
    } catch (error) {
      onError('Error de conexión: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h2>👤 Informacion de contacto </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Nombre <span className="required">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div className="form-group">
          <label>
            Correo Electrónico <span className="required">*</span>
          </label>
          <input
            type="email"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            required
            placeholder="Ej: juan@example.com"
          />
        </div>

        <div className="form-group">
          <label>Teléfono</label>
          <input
            type="text"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Ej: 123456789"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
          {loading ? 'Creando...' : 'Crear solicitud'}
        </button>
      </form>
    </div>
  )
}

interface FormularioSolicitudProps {
  usuario: Usuario
  onSuccess: () => void
  onError: (error: string) => void
  onBack: () => void
}

function FormularioSolicitud({ usuario, onSuccess, onError, onBack }: FormularioSolicitudProps) {
  const [formData, setFormData] = useState({
    tipo: 'INCIDENTE' as 'INCIDENTE' | 'REQUERIMIENTO' | 'CONSULTA',
    nivelPrioridad: 'MEDIA' as 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENCIA',
    descripcion: ''
  })
  const [archivos, setArchivos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const name = e.target.name
    const value = e.target.value
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      // Validar tamaño de archivos (10MB cada uno)
      const maxSize = 10 * 1024 * 1024 // 10MB
      const invalidFiles = filesArray.filter(file => file.size > maxSize)
      
      if (invalidFiles.length > 0) {
        onError('Algunos archivos exceden el tamaño máximo permitido (10MB)')
        return
      }
      
      setArchivos(filesArray)
    }
  }

  const removeFile = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      
      // Agregar datos de la solicitud como JSON con Content-Type
      const solicitudData = {
        tipo: formData.tipo,
        nivelPrioridad: formData.nivelPrioridad,
        usuarioId: usuario.id,
        descripcion: formData.descripcion || null
      }
      const solicitudBlob = new Blob([JSON.stringify(solicitudData)], { type: 'application/json' })
      formDataToSend.append('solicitud', solicitudBlob, 'solicitud.json')
      
      // Agregar archivos
      archivos.forEach((archivo) => {
        formDataToSend.append('archivos', archivo)
      })

      const response = await fetch(`${API_BASE}/solicitudes`, {
        method: 'POST',
        body: formDataToSend
        // No establecer Content-Type manualmente, el navegador lo hace automáticamente con el boundary
      })

      const data = await response.json()

      if (response.ok) {
        setFormData({
          tipo: 'INCIDENTE',
          nivelPrioridad: 'MEDIA',
          descripcion: ''
        })
        setArchivos([])
        onSuccess()
      } else {
        onError(data.message || 'Error al crear solicitud')
      }
    } catch (error) {
      onError('Error de conexión: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h2>Crear Solicitud</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Usuario <span className="required">*</span>
          </label>
          <div className="usuario-info">
            <strong>{usuario.nombre}</strong>
            <span className="usuario-email">{usuario.correo}</span>
            {usuario.telefono && <span className="usuario-phone">Tel: {usuario.telefono}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>
            Tipo de Solicitud <span className="required">*</span>
          </label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            required
          >
            <option value="INCIDENTE">Incidente</option>
            <option value="REQUERIMIENTO">Requerimiento</option>
            <option value="CONSULTA">Consulta</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Nivel de Prioridad <span className="required">*</span>
          </label>
          <select
            name="nivelPrioridad"
            value={formData.nivelPrioridad}
            onChange={handleChange}
            required
          >
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="URGENCIA">Urgencia</option>
          </select>
          <small className="form-hint">
            Selecciona el nivel de prioridad de la solicitud
          </small>
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={4}
            placeholder="Describe el problema o solicitud..."
          />
        </div>

        <div className="form-group">
          <label>Archivos Adjuntos</label>
          <input
            type="file"
            name="archivos"
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            className="file-input"
          />
          <small className="form-hint">
            Máximo 10MB por archivo. Formatos permitidos: imágenes, PDF, Word, Excel, texto
          </small>
          
          {archivos.length > 0 && (
            <div className="archivos-list">
              {archivos.map((archivo, index) => (
                <div key={index} className="archivo-item">
                  <span className="archivo-nombre">{archivo.name}</span>
                  <span className="archivo-tamaño">
                    {(archivo.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="btn-remove-file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="button-group">
          <button type="button" onClick={onBack} className="btn-secondary">
            ← Volver
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creando...' : 'Crear Solicitud'}
          </button>
        </div>
      </form>
    </div>
  )
}

interface PantallaGraciasProps {
  onVolverInicio: () => void
}

function PantallaGracias({ onVolverInicio }: PantallaGraciasProps) {
  return (
    <div className="gracias-container">
      <div className="gracias-content">
        <div className="gracias-icon">✓</div>
        <h2>¡Gracias!</h2>
        <p className="gracias-message">
          Tu solicitud ha sido creada exitosamente.
          <br />
          Nos pondremos en contacto contigo pronto.
        </p>
        <button onClick={onVolverInicio} className="btn-primary">
          Crear Nueva Solicitud
        </button>
      </div>
    </div>
  )
}

interface Solicitud {
  id: number
  tipo: 'INCIDENTE' | 'REQUERIMIENTO' | 'CONSULTA'
  nivelPrioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENCIA'
  prioridadCalculada?: number
  fechaCreacion: string
  descripcion?: string
  usuario: {
    id: number
    nombre: string
    correo: string
  }
  archivos?: Array<{
    id: number
    nombreOriginal: string
    url: string
  }>
}

interface ListaTicketsProps {
  onCrearNuevo: () => void
}

function ListaTickets({ onCrearNuevo }: ListaTicketsProps) {
  const [tickets, setTickets] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTickets, setExpandedTickets] = useState<Set<number>>(new Set())
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [])

  const toggleTicket = (ticketId: number) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId)
      } else {
        newSet.add(ticketId)
      }
      return newSet
    })
  }

  const generarTicketsPrueba = async () => {
    setGenerating(true)
    try {
      const nombres = ['Pedro Pérez', 'María González', 'Juan Rodríguez', 'Ana Martínez', 'Carlos López', 'Laura Sánchez', 'Diego Fernández', 'Sofía Ramírez', 'Luis Torres', 'Carmen Díaz']
      const correos = ['pedro@example.com', 'maria@example.com', 'juan@example.com', 'ana@example.com', 'carlos@example.com', 'laura@example.com', 'diego@example.com', 'sofia@example.com', 'luis@example.com', 'carmen@example.com']
      const tipos: Array<'INCIDENTE' | 'REQUERIMIENTO' | 'CONSULTA'> = ['INCIDENTE', 'REQUERIMIENTO', 'CONSULTA']
      const descripciones = [
        'Se daño el carro ñañaña',
        'Necesito actualizar mi información de contacto',
        '¿Cómo puedo cambiar mi contraseña?',
        'El sistema no está funcionando correctamente',
        'Solicito acceso a nuevos módulos',
        'Tengo una pregunta sobre facturación',
        'Error al iniciar sesión',
        'Necesito ayuda con la configuración',
        'Problema con la impresora',
        'Consulta sobre políticas de la empresa'
      ]

      // Fechas pasadas: hoy es 13/01/2026
      // Crear fechas con diferentes antigüedades para mostrar el boost
      // Cada 48 horas aumenta la prioridad en 1
      // TODAS las fechas deben ser del pasado (mínimo 2 horas atrás)
      const hoy = new Date('2026-01-13T10:00:00')
      // Días y horas atrás desde hoy - todos deben ser del pasado
      const fechasAtras = [
        { dias: 10, horas: 0 },   // 10 días atrás
        { dias: 8, horas: 0 },    // 8 días atrás
        { dias: 6, horas: 0 },   // 6 días atrás
        { dias: 4, horas: 0 },    // 4 días atrás
        { dias: 3, horas: 0 },   // 3 días atrás
        { dias: 2, horas: 0 },   // 2 días atrás
        { dias: 1, horas: 0 },   // 1 día atrás
        { dias: 0, horas: 12 },  // 12 horas atrás
        { dias: 0, horas: 6 },   // 6 horas atrás
        { dias: 0, horas: 2 }    // 2 horas atrás (mínimo)
      ]
      
      for (let i = 0; i < 10; i++) {
        // Crear usuario
        const usuarioResponse = await fetch(`${API_BASE}/usuarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: nombres[i],
            correo: correos[i],
            telefono: `+34 600 ${String(i).padStart(6, '0')}`
          })
        })

        if (!usuarioResponse.ok) {
          throw new Error('Error al crear usuario de prueba')
        }

        const usuario = await usuarioResponse.json()

        // Calcular fecha pasada - asegurar que siempre sea del pasado
        const fechaPasada = new Date(hoy)
        fechaPasada.setDate(fechaPasada.getDate() - fechasAtras[i].dias)
        fechaPasada.setHours(fechaPasada.getHours() - fechasAtras[i].horas)
        // Ajustar minutos para variar (35 minutos)
        fechaPasada.setMinutes(35, 0, 0)
        
        // Formatear fecha para el backend (ISO 8601)
        const fechaISO = fechaPasada.toISOString().slice(0, 19) // Formato: YYYY-MM-DDTHH:mm:ss

        // Crear solicitud con fecha personalizada
        const solicitudResponse = await fetch(`${API_BASE}/solicitudes/prueba?fechaCreacion=${encodeURIComponent(fechaISO)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tipo: tipos[i % tipos.length],
            nivelPrioridad: ['BAJA', 'MEDIA', 'ALTA', 'URGENCIA'][i % 4], // Rotar entre los niveles
            usuarioId: usuario.id,
            descripcion: descripciones[i]
          })
        })

        if (!solicitudResponse.ok) {
          throw new Error('Error al crear solicitud de prueba')
        }
      }

      // Recargar tickets después de generar
      await loadTickets()
      alert('✅ Se generaron 10 tickets de prueba exitosamente')
    } catch (err) {
      alert('Error al generar tickets de prueba: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setGenerating(false)
    }
  }

  const loadTickets = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/solicitudes/ordenadas`)
      if (!response.ok) {
        throw new Error('Error al cargar tickets')
      }
      const data = await response.json()
      setTickets(data)
    } catch (err) {
      setError('Error al cargar los tickets: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day} ${month} ${year}, ${hours}:${minutes}`
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'INCIDENTE':
        return 'Incidente'
      case 'REQUERIMIENTO':
        return 'Requerimiento'
      case 'CONSULTA':
        return 'Consulta'
      default:
        return tipo
    }
  }

  const getNivelPrioridadLabel = (nivel: string) => {
    switch (nivel) {
      case 'BAJA':
        return 'Baja'
      case 'MEDIA':
        return 'Media'
      case 'ALTA':
        return 'Alta'
      case 'URGENCIA':
        return 'Urgencia'
      default:
        return nivel
    }
  }

  const getPrioridadColor = (nivel: string) => {
    switch (nivel) {
      case 'URGENCIA':
        return 'prioridad-5'
      case 'ALTA':
        return 'prioridad-4'
      case 'MEDIA':
        return 'prioridad-3'
      case 'BAJA':
        return 'prioridad-1'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="tickets-container">
        <div className="loading-message">Cargando tickets...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tickets-container">
        <div className="error-message">{error}</div>
        <button onClick={loadTickets} className="btn-primary">Reintentar</button>
      </div>
    )
  }

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <h2>Lista de Tickets</h2>
        <div className="tickets-actions">
          <button 
            onClick={generarTicketsPrueba} 
            className="btn-generate"
            disabled={generating}
          >
            {generating ? 'Generando...' : 'Generar Tickets de Prueba'}
          </button>
          <button onClick={loadTickets} className="btn-secondary">
            Actualizar
          </button>
          <button onClick={onCrearNuevo} className="btn-primary">
            Crear Nuevo Ticket
          </button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <p>No hay tickets creados aún.</p>
          <button onClick={onCrearNuevo} className="btn-primary">
            Crear Primer Ticket
          </button>
        </div>
      ) : (
        <div className="tickets-list">
          {tickets.map((ticket) => {
            const isExpanded = expandedTickets.has(ticket.id)
            return (
              <div key={ticket.id} className="ticket-card">
                <div 
                  className="ticket-header-clickable"
                  onClick={() => toggleTicket(ticket.id)}
                >
                  <div className="ticket-header-content">
                    <div className="ticket-id">#{ticket.id}</div>
                    <div className={`badge-tipo badge-${ticket.tipo.toLowerCase()}`}>
                      {getTipoLabel(ticket.tipo)}
                    </div>
                    <div className={`badge-prioridad ${getPrioridadColor(ticket.nivelPrioridad)}`}>
                      {getNivelPrioridadLabel(ticket.nivelPrioridad)}
                    </div>
                    <div className="badge-fecha-header">
                      {formatDate(ticket.fechaCreacion)}
                    </div>
                    {ticket.prioridadCalculada !== undefined && (
                      <div className="badge-prioridad-calculada">
                        Total: {ticket.prioridadCalculada}
                      </div>
                    )}
                  </div>
                  <div className="ticket-expand-icon">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="ticket-body">
                    <div className="ticket-usuario">
                      <strong>{ticket.usuario.nombre}</strong>
                      <span className="ticket-email">{ticket.usuario.correo}</span>
                    </div>
                    
                    {ticket.descripcion && (
                      <div className="ticket-descripcion">
                        <p>{ticket.descripcion}</p>
                      </div>
                    )}

                    {ticket.archivos && ticket.archivos.length > 0 && (
                      <div className="ticket-archivos">
                        <strong>Archivos adjuntos:</strong>
                        <ul>
                          {ticket.archivos.map((archivo) => (
                            <li key={archivo.id}>
                              <a href={`${API_BASE}${archivo.url}`} target="_blank" rel="noopener noreferrer">
                                {archivo.nombreOriginal}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="ticket-footer">
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default App
