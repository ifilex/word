import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FileText, 
  FolderOpen, 
  Save, 
  Download, 
  Printer, 
  Clock, 
  Info, 
  HardDrive, 
  Upload, 
  Check, 
  FileCode, 
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  AlertCircle,
  CloudCheck,
  CheckCircle2,
  LogIn
} from 'lucide-react';
import { DOCUMENT_TEMPLATES, DocTemplate } from '../../data/templates';
import { CloudAccount, DocumentMetadata } from '../../types/document';
import { getAllLocalDocuments } from '../../utils/cloudSync';
import { parseDocumentFile } from '../../utils/documentParsers';
import { 
  listGoogleDriveFiles, 
  downloadGoogleDriveFile, 
  saveDocumentToGoogleDrive, 
  deleteGoogleDriveFile,
  signInWithGoogle,
  getGoogleAccessToken,
  DriveFileInfo 
} from '../../utils/googleDrive';

interface BackstageModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  content: string;
  onSelectTemplate: (template: DocTemplate) => void;
  onLoadDocument: (title: string, html: string) => void;
  onSave: () => void;
  onExport: (format: 'docx' | 'pdf' | 'html' | 'rtf' | 'txt' | 'md' | 'json') => void;
  onPrint: () => void;
  onOpenCloudSync: () => void;
  onOpenVersionHistory: () => void;
  metadata: DocumentMetadata;
  cloudAccounts: CloudAccount[];
}

export const BackstageModal: React.FC<BackstageModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  content,
  onSelectTemplate,
  onLoadDocument,
  onSave,
  onExport,
  onPrint,
  onOpenCloudSync,
  onOpenVersionHistory,
  metadata,
  cloudAccounts,
}) => {
  const [activeSection, setActiveSection] = useState<'info' | 'new' | 'open' | 'save' | 'export' | 'history'>('new');
  const [openSourceTab, setOpenSourceTab] = useState<'device' | 'gdrive' | 'browser'>('device');
  const [dragActive, setDragActive] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive Real State
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSaveSuccess, setDriveSaveSuccess] = useState<{ name: string; link?: string } | null>(null);

  const localSavedDocs = getAllLocalDocuments();
  const googleAccount = cloudAccounts.find(a => a.provider === 'google-drive');
  const hasGoogleAuth = !!getGoogleAccessToken() || (googleAccount && googleAccount.connected);

  // Fetch Drive files when opening Google Drive tab
  const fetchDriveFiles = async (query = '') => {
    const token = getGoogleAccessToken();
    if (!token) {
      setDriveFiles([]);
      return;
    }

    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const files = await listGoogleDriveFiles(query, token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Error fetching Drive files:', err);
      setDriveError(err.message || 'Error al conectar con Google Drive');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  useEffect(() => {
    if (isOpen && openSourceTab === 'gdrive') {
      fetchDriveFiles(driveSearch);
    }
  }, [isOpen, openSourceTab]);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setIsLoadingFile(true);
    try {
      const parsed = await parseDocumentFile(file);
      onLoadDocument(parsed.title, parsed.html);
      onClose();
    } catch (e) {
      console.error('Error importing document', e);
      alert('Error al leer el archivo. Por favor intente con un archivo .docx, .rtf, .html o .txt');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Connect Google from inside Backstage
  const handleConnectGoogleDrive = async () => {
    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const { accessToken } = await signInWithGoogle();
      await fetchDriveFiles();
    } catch (err: any) {
      setDriveError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Open Drive File
  const handleOpenDriveFile = async (file: DriveFileInfo) => {
    setIsLoadingFile(true);
    setDriveError(null);
    try {
      const { title, html } = await downloadGoogleDriveFile(file.id, file.mimeType, file.name);
      onLoadDocument(title, html);
      onClose();
    } catch (err: any) {
      console.error('Error opening drive file:', err);
      setDriveError(err.message || 'No se pudo abrir el archivo seleccionado de Drive');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Delete Drive File
  const handleDeleteDriveFile = async (e: React.MouseEvent, file: DriveFileInfo) => {
    e.stopPropagation();
    try {
      const deleted = await deleteGoogleDriveFile(file.id, file.name);
      if (deleted) {
        setDriveFiles(prev => prev.filter(f => f.id !== file.id));
      }
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el archivo');
    }
  };

  // Save directly to Google Drive
  const handleSaveDirectToDrive = async () => {
    const token = getGoogleAccessToken();
    if (!token) {
      handleConnectGoogleDrive();
      return;
    }

    setIsSavingToDrive(true);
    setDriveError(null);
    setDriveSaveSuccess(null);
    try {
      const res = await saveDocumentToGoogleDrive(metadata.title, content);
      setDriveSaveSuccess({ name: res.name, link: res.webViewLink });
      onSave(); // Also save local version
    } catch (err: any) {
      setDriveError(err.message || 'Error al guardar en Google Drive');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  return (
    <div 
      id="modal-office-backstage"
      className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Office Backstage Blue Navigation Sidebar */}
      <nav 
        className={`w-64 md:w-72 shrink-0 flex flex-col justify-between py-6 px-4 select-none ${
          darkMode ? 'bg-slate-900 border-r border-slate-800 text-white' : 'bg-[#185abd] text-white'
        }`}
      >
        <div>
          {/* Back button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 mb-8 text-xs font-semibold px-3 py-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              ←
            </div>
            <span>Volver al Documento</span>
          </button>

          {/* Nav Items */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveSection('new')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeSection === 'new' ? 'bg-white/20 font-bold' : 'hover:bg-white/10 opacity-85 hover:opacity-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nuevo</span>
            </button>

            <button
              onClick={() => setActiveSection('open')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeSection === 'open' ? 'bg-white/20 font-bold' : 'hover:bg-white/10 opacity-85 hover:opacity-100'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Abrir Archivo (.docx, .rtf, .txt)</span>
            </button>

            <button
              onClick={() => {
                onSave();
                setActiveSection('save');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeSection === 'save' ? 'bg-white/20 font-bold' : 'hover:bg-white/10 opacity-85 hover:opacity-100'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Guardar en la Nube</span>
            </button>

            <button
              onClick={() => setActiveSection('export')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeSection === 'export' ? 'bg-white/20 font-bold' : 'hover:bg-white/10 opacity-85 hover:opacity-100'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Exportar (PDF, DOCX, HTML)</span>
            </button>

            <button
              onClick={() => {
                onClose();
                setTimeout(onPrint, 200);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium hover:bg-white/10 opacity-85 hover:opacity-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Documento</span>
            </button>

            <button
              onClick={() => setActiveSection('history')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeSection === 'history' ? 'bg-white/20 font-bold' : 'hover:bg-white/10 opacity-85 hover:opacity-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Historial de Versiones</span>
            </button>

            <button
              onClick={() => setActiveSection('info')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeSection === 'info' ? 'bg-white/20 font-bold' : 'hover:bg-white/10 opacity-85 hover:opacity-100'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Información y Métricas</span>
            </button>
          </div>
        </div>

        {/* Cloud Sync shortcut */}
        <div className="pt-4 border-t border-white/20">
          <button
            onClick={() => {
              onClose();
              onOpenCloudSync();
            }}
            className="w-full flex items-center justify-between text-xs px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-sky-300" />
              <span>Cuentas Cloud</span>
            </div>
            <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded">
              {cloudAccounts.filter(a => a.connected).length} activas
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main 
        className={`flex-1 overflow-y-auto p-6 md:p-10 ${
          darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
      >
        {/* =========================================================================
            SECTION: NUEVO (NEW TEMPLATES)
           ========================================================================= */}
        {activeSection === 'new' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Nuevo Documento</h2>
              <p className="text-sm text-slate-500 mt-1">
                Selecciona una plantilla o crea un lienzo en blanco para empezar a redactar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOCUMENT_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    onSelectTemplate(tmpl);
                    onClose();
                  }}
                  className={`p-5 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all flex flex-col justify-between ${
                    darkMode 
                      ? 'bg-slate-900 border-slate-800 hover:border-blue-500 shadow-lg' 
                      : 'bg-white border-slate-200 hover:border-blue-600 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                        {tmpl.category}
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                        {tmpl.pageSize}
                      </span>
                    </div>
                    <h3 className="font-bold text-base mb-1.5">{tmpl.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-blue-600 font-semibold">
                    <span>Crear documento</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION: ABRIR (OPEN LOCAL / REAL GOOGLE DRIVE FILES)
           ========================================================================= */}
        {activeSection === 'open' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Abrir Documento</h2>
              <p className="text-sm text-slate-500 mt-1">
                Abre archivos .docx, .rtf, .html, .txt desde tu dispositivo o directamente desde Google Drive.
              </p>
            </div>

            {/* Source switcher tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                onClick={() => setOpenSourceTab('device')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  openSourceTab === 'device'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Este Dispositivo</span>
              </button>

              <button
                onClick={() => setOpenSourceTab('gdrive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  openSourceTab === 'gdrive'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                <span>Google Drive {hasGoogleAuth ? '(Conectado)' : ''}</span>
              </button>

              <button
                onClick={() => setOpenSourceTab('browser')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  openSourceTab === 'browser'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Guardados en Navegador ({localSavedDocs.length})</span>
              </button>
            </div>

            {/* TAB: Local Device Drag & Drop Upload */}
            {openSourceTab === 'device' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.rtf,.html,.htm,.txt,.md,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="font-bold text-lg mb-1">Arrastra y suelta tu archivo Word aquí</h3>
                <p className="text-xs text-slate-500 max-w-sm mb-6">
                  Soporta formatos <strong>.docx, .rtf, .html, .txt, .md</strong> con extracción completa de tablas y estilos.
                </p>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoadingFile}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-2"
                >
                  {isLoadingFile ? (
                    <span>Procesando archivo...</span>
                  ) : (
                    <>
                      <FolderOpen className="w-4 h-4" />
                      <span>Examinar archivos del equipo</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB: Real Google Drive Files List */}
            {openSourceTab === 'gdrive' && (
              <div className="space-y-4">
                {driveError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{driveError}</span>
                  </div>
                )}

                {!getGoogleAccessToken() ? (
                  /* Google Sign In Call to Action */
                  <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-3">
                      <HardDrive className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-base mb-1">Conecta tu cuenta de Google Drive</h3>
                    <p className="text-xs text-slate-500 max-w-md mb-5">
                      Inicia sesión para ver tus archivos reales de Google Drive, abrirlos en Word Studio y sincronizar cambios en tiempo real.
                    </p>
                    <button
                      onClick={handleConnectGoogleDrive}
                      disabled={isLoadingDrive}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isLoadingDrive ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                      <span>Iniciar sesión con Google</span>
                    </button>
                  </div>
                ) : (
                  /* Real Files List from Google Drive */
                  <div className="space-y-3">
                    {/* Search and Refresh Bar */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={driveSearch}
                          onChange={(e) => setDriveSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && fetchDriveFiles(driveSearch)}
                          placeholder="Buscar documentos en Google Drive..."
                          className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-hidden ${
                            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>
                      <button
                        onClick={() => fetchDriveFiles(driveSearch)}
                        disabled={isLoadingDrive}
                        className="p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Actualizar lista de Drive"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {isLoadingDrive ? (
                      <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                        <span>Cargando archivos desde Google Drive...</span>
                      </div>
                    ) : driveFiles.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        No se encontraron documentos en tu Google Drive con los criterios especificados.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {driveFiles.map((file) => (
                          <div
                            key={file.id}
                            onClick={() => handleOpenDriveFile(file)}
                            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer hover:border-blue-500 transition-all ${
                              darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-200 shadow-xs hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {file.mimeType.includes('document') ? 'DOC' : 'W'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-xs truncate max-w-md">{file.name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>{file.size}</span>
                                  <span>•</span>
                                  <span>Modificado: {file.modifiedTime}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                                  title="Ver en Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={(e) => handleDeleteDriveFile(e, file)}
                                className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Eliminar de Drive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs text-blue-600 font-semibold ml-2">Abrir →</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Browser saved documents */}
            {openSourceTab === 'browser' && (
              <div className="space-y-3">
                {localSavedDocs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No hay documentos guardados localmente todavía.<br />
                    Tus documentos se guardan automáticamente al escribir.
                  </div>
                ) : (
                  localSavedDocs.map((item) => (
                    <div
                      key={item.meta.id}
                      onClick={() => {
                        onLoadDocument(item.meta.title, item.htmlContent);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer hover:border-blue-500 transition-all ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          DOC
                        </div>
                        <div>
                          <div className="font-semibold text-xs">{item.meta.title}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.meta.wordCount} palabras • Actualizado: {new Date(item.meta.updatedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-blue-600 font-semibold">Abrir →</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SECTION: GUARDAR EN LA NUBE (REAL DRIVE SAVE & CLOUD REPOSITORY)
           ========================================================================= */}
        {activeSection === 'save' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Guardar en la Nube</h2>
              <p className="text-sm text-slate-500 mt-1">
                Sincroniza y almacena tu documento directamente en tu cuenta de Google Drive o en tu almacenamiento local cifrado.
              </p>
            </div>

            {driveSaveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>¡Documento "<strong>{driveSaveSuccess.name}</strong>" guardado con éxito en Google Drive!</span>
                </div>
                {driveSaveSuccess.link && (
                  <a 
                    href={driveSaveSuccess.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold underline flex items-center gap-1 ml-4"
                  >
                    <span>Abrir en Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {driveError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{driveError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Google Drive Real Save */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center font-bold">
                      GD
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Google Drive</h3>
                      <p className="text-[11px] text-slate-500">
                        {getGoogleAccessToken() ? 'Sesión activa' : 'Requiere iniciar sesión'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Guarda una copia sincronizada de "<strong>{metadata.title}</strong>" directamente en tu unidad de Google Drive.
                  </p>
                </div>

                <button
                  onClick={handleSaveDirectToDrive}
                  disabled={isSavingToDrive}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSavingToDrive ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando en Drive...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar en Google Drive ahora</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: Browser Cloud Vault Save */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center font-bold">
                      DOC
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Bóveda del Navegador</h3>
                      <p className="text-[11px] text-slate-500">Almacenamiento local persistente</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Guarda una instantánea local accesible en cualquier momento desde la pestaña "Guardados en Navegador".
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSave();
                    alert('¡Documento guardado localmente con éxito!');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar copia local</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION: EXPORTAR (EXPORT FORMATS)
           ========================================================================= */}
        {activeSection === 'export' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Exportar Documento</h2>
              <p className="text-sm text-slate-500 mt-1">
                Descarga tu documento en el formato estándar que requieras.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* DOCX Export */}
              <div 
                onClick={() => { onExport('docx'); onClose(); }}
                className={`p-5 rounded-xl border cursor-pointer hover:border-blue-500 transition-all ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-600 font-bold flex items-center justify-center">
                    DOCX
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Microsoft Word (.docx)</h3>
                    <p className="text-[11px] text-slate-500">Compatible con Word 365, LibreOffice y Google Docs.</p>
                  </div>
                </div>
              </div>

              {/* PDF Export */}
              <div 
                onClick={() => { onExport('pdf'); onClose(); }}
                className={`p-5 rounded-xl border cursor-pointer hover:border-rose-500 transition-all ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-600 font-bold flex items-center justify-center">
                    PDF
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Documento PDF (.pdf)</h3>
                    <p className="text-[11px] text-slate-500">Vectorial de alta fidelidad para impresión y contratos.</p>
                  </div>
                </div>
              </div>

              {/* HTML5 Export */}
              <div 
                onClick={() => { onExport('html'); onClose(); }}
                className={`p-5 rounded-xl border cursor-pointer hover:border-amber-500 transition-all ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-600 font-bold flex items-center justify-center">
                    HTML
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Página Web HTML5 (.html)</h3>
                    <p className="text-[11px] text-slate-500">Código limpio con estilos CSS embebidos para publicación.</p>
                  </div>
                </div>
              </div>

              {/* RTF Export */}
              <div 
                onClick={() => { onExport('rtf'); onClose(); }}
                className={`p-5 rounded-xl border cursor-pointer hover:border-purple-500 transition-all ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-600 font-bold flex items-center justify-center">
                    RTF
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Rich Text Format (.rtf)</h3>
                    <p className="text-[11px] text-slate-500">Formato enriquecido multiplataforma universal.</p>
                  </div>
                </div>
              </div>

              {/* Plain Text */}
              <div 
                onClick={() => { onExport('txt'); onClose(); }}
                className={`p-5 rounded-xl border cursor-pointer hover:border-slate-500 transition-all ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold flex items-center justify-center">
                    TXT
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Texto Plano (.txt)</h3>
                    <p className="text-[11px] text-slate-500">Texto sin formato para notas rápidas o análisis de datos.</p>
                  </div>
                </div>
              </div>

              {/* Markdown */}
              <div 
                onClick={() => { onExport('md'); onClose(); }}
                className={`p-5 rounded-xl border cursor-pointer hover:border-sky-500 transition-all ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-600 font-bold flex items-center justify-center">
                    MD
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Documento Markdown (.md)</h3>
                    <p className="text-[11px] text-slate-500">Compatible con repositorios GitHub, Obsidian y Notion.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION: INFORMACIÓN (DOCUMENT INFO)
           ========================================================================= */}
        {activeSection === 'info' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Información del Documento</h2>
              <p className="text-sm text-slate-500 mt-1">
                Propiedades, métricas de redacción y estado de sincronización.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-400">Total Palabras</div>
                  <div className="text-xl font-bold text-blue-600">{metadata.wordCount}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Caracteres</div>
                  <div className="text-xl font-bold">{metadata.charCount}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Tamaño de Hoja</div>
                  <div className="text-xl font-bold">{metadata.pageSize}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Versión</div>
                  <div className="text-xl font-bold text-emerald-600">v{metadata.version}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
                <div>
                  <span className="text-slate-400">Título:</span>
                  <div className="font-semibold text-sm mt-0.5">{metadata.title}</div>
                </div>
                <div>
                  <span className="text-slate-400">Autor:</span>
                  <div className="font-semibold text-sm mt-0.5">{metadata.author}</div>
                </div>
                <div>
                  <span className="text-slate-400">Fecha de Creación:</span>
                  <div className="mt-0.5">{new Date(metadata.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-400">Última Modificación:</span>
                  <div className="mt-0.5">{new Date(metadata.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION: HISTORIAL (VERSION HISTORY)
           ========================================================================= */}
        {activeSection === 'history' && (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Historial de Versiones</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Control de versiones automático y puntos de restauración.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenVersionHistory();
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                Abrir Administrador Completo
              </button>
            </div>

            <div className={`p-6 rounded-2xl border text-xs space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold">Versión Actual (v{metadata.version})</span>
                <span className="text-slate-400 ml-auto">{new Date().toLocaleTimeString()}</span>
              </div>
              <p className="text-slate-500 pl-5">
                Los cambios se guardan continuamente cada vez que editas el texto. Puedes crear instantáneas con nombre desde el menú de historial.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
