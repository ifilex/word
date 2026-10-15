/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { Ribbon, RibbonTab } from './components/Ribbon';
import { DocumentCanvas } from './components/DocumentCanvas';
import { StatusBar } from './components/StatusBar';
import { BackstageModal } from './components/modals/BackstageModal';
import { CloudSyncModal } from './components/modals/CloudSyncModal';
import { ScriptEditorModal } from './components/modals/ScriptEditorModal';
import { ExtensionsModal } from './components/modals/ExtensionsModal';
import { FindReplaceModal } from './components/modals/FindReplaceModal';
import { ShareModal } from './components/modals/ShareModal';
import { WordStatsModal } from './components/modals/WordStatsModal';
import { VersionHistoryModal } from './components/modals/VersionHistoryModal';
import { SymbolPickerModal } from './components/modals/SymbolPickerModal';
import { ReadAloudWidget } from './components/modals/ReadAloudWidget';
import { PrintModal } from './components/modals/PrintModal';
import { DOCUMENT_TEMPLATES, DocTemplate } from './data/templates';
import { 
  DocumentMetadata, 
  PageSettings, 
  Collaborator, 
  DocumentComment, 
  CloudAccount,
  DocumentVersion
} from './types/document';
import { 
  getSavedCloudAccounts, 
  saveCloudAccounts, 
  saveDocumentLocally, 
  saveVersionSnapshot 
} from './utils/cloudSync';
import { 
  INITIAL_COLLABORATORS, 
  INITIAL_COMMENTS, 
  CollaborationSyncChannel 
} from './utils/collaboration';
import { 
  exportToDocx, 
  exportToHtml, 
  exportToPdf, 
  exportToRtf, 
  exportToTxt, 
  exportToMarkdown, 
  downloadBlob 
} from './utils/documentParsers';
import { executeDocumentScript, PRESET_SCRIPTS } from './utils/scriptEngine';
import { 
  initGoogleAuth, 
  getGoogleAccessToken, 
  saveDocumentToGoogleDrive, 
  getGoogleDriveQuota 
} from './utils/googleDrive';

export default function App() {
  // Theme & Appearance
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [nightCanvasMode, setNightCanvasMode] = useState<boolean>(false);
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTab>('inicio');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [showNavPane, setShowNavPane] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);

  // Document State - Starts completely blank as requested
  const initialTemplate = DOCUMENT_TEMPLATES[0]; // Blank Document default
  const [title, setTitle] = useState<string>('Documento1');
  const [content, setContent] = useState<string>(initialTemplate.content);
  
  // Page Configuration
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 25, bottom: 25, left: 25, right: 25 },
    pageColor: '#ffffff',
    headerText: '',
    footerText: '',
    showPageNumbers: true,
    columns: 1,
    watermarkText: undefined,
    watermarkOpacity: 0.12
  });

  // Undo / Redo History Stack
  const [history, setHistory] = useState<string[]>([initialTemplate.content]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Metadata & Stats
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    id: 'doc-1',
    title: 'Documento1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: '',
    version: 1,
    wordCount: 0,
    charCount: 0,
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 25, bottom: 25, left: 25, right: 25 },
    tags: []
  });

  // Clouds, Collaboration & Comments
  const [cloudAccounts, setCloudAccounts] = useState<CloudAccount[]>(getSavedCloudAccounts);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [comments, setComments] = useState<DocumentComment[]>(INITIAL_COMMENTS);
  const [trackChangesActive, setTrackChangesActive] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSavedText, setLastSavedText] = useState<string>('Guardado en la nube');

  // Modals state
  const [backstageOpen, setBackstageOpen] = useState<boolean>(false);
  const [cloudSyncOpen, setCloudSyncOpen] = useState<boolean>(false);
  const [scriptsOpen, setScriptsOpen] = useState<boolean>(false);
  const [extensionsOpen, setExtensionsOpen] = useState<boolean>(false);
  const [selectedExtensionId, setSelectedExtensionId] = useState<string>('ai-copilot');
  const [findReplaceOpen, setFindReplaceOpen] = useState<boolean>(false);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [wordStatsOpen, setWordStatsOpen] = useState<boolean>(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState<boolean>(false);
  const [symbolPickerOpen, setSymbolPickerOpen] = useState<boolean>(false);
  const [readAloudOpen, setReadAloudOpen] = useState<boolean>(false);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const syncChannelRef = useRef<CollaborationSyncChannel | null>(null);
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update word & character count
  const updateStats = useCallback((html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const plainText = tempDiv.innerText || tempDiv.textContent || '';
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = plainText.length;

    setMetadata(prev => ({
      ...prev,
      wordCount: words,
      charCount: chars,
      updatedAt: new Date().toISOString()
    }));
  }, []);

  // Update content with debounced history pushing for ultra-smooth typing
  const handleContentChange = useCallback((newHtml: string, pushHistory = true) => {
    setContent(newHtml);
    updateStats(newHtml);

    if (pushHistory) {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = setTimeout(() => {
        setHistory(prev => {
          const sliced = prev.slice(0, historyIndex + 1);
          return [...sliced, newHtml].slice(-50); // Max 50 history snapshots
        });
        setHistoryIndex(prev => prev + 1);
      }, 500);
    }

    // Broadcast change to other open browser tabs
    syncChannelRef.current?.broadcast('CONTENT_UPDATE', { title, html: newHtml });
  }, [historyIndex, title, updateStats]);

  // Real-time multi-tab / cloud synchronization channel
  useEffect(() => {
    const channel = new CollaborationSyncChannel();
    syncChannelRef.current = channel;

    channel.subscribe((data) => {
      if (data?.type === 'CONTENT_UPDATE' && data.payload?.html) {
        setContent(data.payload.html);
      }
    });

    // Listen to Google Auth session state
    const unsubscribeGoogle = initGoogleAuth(
      (user, token) => {
        setCloudAccounts(prev => {
          const updated = prev.map(acc => {
            if (acc.provider === 'google-drive') {
              return {
                ...acc,
                connected: true,
                email: user.email || acc.email,
                avatar: user.photoURL || undefined,
                lastSync: 'Conectado'
              };
            }
            return acc;
          });
          saveCloudAccounts(updated);
          return updated;
        });

        // Optionally fetch real quota
        if (token) {
          getGoogleDriveQuota(token).then(quota => {
            setCloudAccounts(prev => {
              const updated = prev.map(acc => {
                if (acc.provider === 'google-drive') {
                  return {
                    ...acc,
                    storageUsedMb: Math.round(quota.storageUsedBytes / (1024 * 1024)),
                    storageTotalMb: Math.round(quota.storageTotalBytes / (1024 * 1024))
                  };
                }
                return acc;
              });
              saveCloudAccounts(updated);
              return updated;
            });
          }).catch(e => console.warn('Could not sync quota', e));
        }
      },
      () => {
        setCloudAccounts(prev => {
          const updated = prev.map(acc => {
            if (acc.provider === 'google-drive') {
              return {
                ...acc,
                connected: false,
                email: '',
                avatar: undefined,
                lastSync: undefined
              };
            }
            return acc;
          });
          saveCloudAccounts(updated);
          return updated;
        });
      }
    );

    return () => {
      channel.destroy();
      unsubscribeGoogle();
    };
  }, []);

  // Auto-save loop to Local Storage & Browser Vault
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDocumentLocally(metadata, content);
      setLastSavedText(`Guardado ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 2500);

    return () => clearTimeout(timer);
  }, [content, metadata]);

  // Handle Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevContent = history[prevIndex];
      setHistoryIndex(prevIndex);
      setContent(prevContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = prevContent;
      }
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextContent = history[nextIndex];
      setHistoryIndex(nextIndex);
      setContent(nextContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = nextContent;
      }
    }
  }, [history, historyIndex]);

  // Manual save trigger
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    saveDocumentLocally(metadata, content);
    
    // Save version snapshot
    saveVersionSnapshot(metadata.id, {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      title: `Guardado manual`,
      htmlContent: content,
      author: metadata.author || 'Usuario'
    });

    setTimeout(() => {
      setIsSaving(false);
      setLastSavedText(`Sincronizado ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 600);
  }, [content, metadata]);

  // Global Keyboard Shortcuts (Word Studio 365)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setFindReplaceOpen(true);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setFindReplaceOpen(true);
      } else if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setPrintModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  // Multi-cloud instant sync
  const handleSyncAllClouds = async () => {
    setIsSyncing(true);
    saveDocumentLocally(metadata, content);
    
    // If Google Drive is active, save directly to user's Google Drive as well
    const gdriveAcc = cloudAccounts.find(a => a.provider === 'google-drive');
    const token = getGoogleAccessToken();
    if (gdriveAcc?.connected && token) {
      try {
        await saveDocumentToGoogleDrive(title, content, undefined, token);
      } catch (err) {
        console.warn('Sync to Google Drive failed:', err);
      }
    }

    await new Promise(r => setTimeout(r, 600));
    setIsSyncing(false);
    setLastSavedText('Sincronizado con Google Drive & Bóveda Local');
  };

  // Execute rich text formatting
  const handleFormat = (command: string, value: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (command === 'formatBlock') {
      document.execCommand('formatBlock', false, value);
    } else if (command === 'fontName') {
      document.execCommand('fontName', false, value);
    } else if (command === 'fontSize') {
      document.execCommand('fontSize', false, value);
    } else if (command === 'foreColor') {
      document.execCommand('foreColor', false, value);
    } else if (command === 'hiliteColor') {
      document.execCommand('hiliteColor', false, value);
    } else if (command === 'lineSpacing') {
      // Apply style to current selection parent block
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const parent = selection.anchorNode?.parentElement;
        if (parent) {
          parent.style.lineHeight = value;
        }
      }
    } else if (command === 'insertHorizontalRule') {
      document.execCommand('insertHorizontalRule', false);
    } else if (command === 'insertHTML') {
      document.execCommand('insertHTML', false, value);
    } else {
      document.execCommand(command, false, value);
    }

    if (editorRef.current) {
      handleContentChange(editorRef.current.innerHTML);
    }
  };

  // Insert Table
  const handleInsertTable = (rows: number, cols: number) => {
    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;"><thead><tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">`;
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Encabezado ${c + 1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < rows - 1; r++) {
      tableHtml += `<tr style="${r % 2 === 1 ? 'background-color: #f8fafc;' : ''}">`;
      for (let c = 0; c < cols; c++) {
        tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Dato fila ${r + 1}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br></p>`;
    handleFormat('insertHTML', tableHtml);
  };

  // Insert Image Prompt / Uploader
  const handleInsertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          const base64 = loadEvt.target?.result as string;
          handleFormat('insertHTML', `<div style="margin: 16px 0; text-align: center;"><img src="${base64}" alt="Imagen insertada" style="max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" /><p style="font-size: 11px; color: #64748b; margin-top: 6px;">Figura: ${file.name}</p></div><p><br></p>`);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Insert Hyperlink
  const handleInsertLink = () => {
    const url = prompt('Introduce la URL del hipervínculo:', 'https://');
    if (url) {
      document.execCommand('createLink', false, url);
      if (editorRef.current) {
        handleContentChange(editorRef.current.innerHTML);
      }
    }
  };

  // Insert Comment on selection
  const handleAddComment = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || 'Párrafo seleccionado';
    const commentText = prompt('Escribe tu comentario colaborativo:');
    if (!commentText) return;

    const newComment: DocumentComment = {
      id: `cmt-${Date.now()}`,
      author: 'Tú (Propietario)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80',
      timestamp: 'Justo ahora',
      text: commentText,
      selectedText,
      resolved: false
    };

    setComments(prev => [newComment, ...prev]);
    setShowComments(true);
  };

  // Export Router
  const handleExport = (format: 'docx' | 'pdf' | 'html' | 'rtf' | 'txt' | 'md' | 'json') => {
    if (format === 'docx') exportToDocx(title, content);
    else if (format === 'pdf') {
      exportToPdf(title, content, {
        pageSize: pageSettings.size as any,
        orientation: pageSettings.orientation,
        watermarkText: pageSettings.watermarkText,
        pageColor: pageSettings.pageColor || '#ffffff'
      });
    }
    else if (format === 'html') exportToHtml(title, content);
    else if (format === 'rtf') exportToRtf(title, content);
    else if (format === 'txt') exportToTxt(title, content);
    else if (format === 'md') exportToMarkdown(title, content);
    else if (format === 'json') {
      const blob = new Blob([JSON.stringify({ metadata, content }, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${title}.json`);
    }
  };

  // Run Quick APA 7 Macro
  const handleRunApaScript = async () => {
    let working = content;
    const apaScript = PRESET_SCRIPTS[0];
    await executeDocumentScript(apaScript.code, {
      getContent: () => working,
      setContent: (html) => {
        working = html;
        handleContentChange(html);
      },
      insertHtml: (h) => {
        working += h;
        handleContentChange(working);
      },
      getText: () => {
        const d = document.createElement('div');
        d.innerHTML = working;
        return d.innerText || '';
      },
      log: (msg) => console.log('Script APA:', msg)
    });
  };

  // Reset to a 100% clean, blank document
  const handleNewDocument = useCallback(() => {
    setTitle('Documento1');
    setContent('');
    setHistory(['']);
    setHistoryIndex(0);
    setMetadata(prev => ({
      ...prev,
      title: 'Documento1',
      wordCount: 0,
      charCount: 0,
      version: 1
    }));
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      editorRef.current.focus();
    }
  }, []);

  return (
    <div 
      id="word-studio-root-container"
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans select-none ${
        darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. Title Bar (Header) */}
      {!focusMode && (
        <TitleBar
          title={title}
          onTitleChange={setTitle}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onPrint={() => setPrintModalOpen(true)}
          onNewDocument={handleNewDocument}
          onOpenBackstage={() => setBackstageOpen(true)}
          onOpenCloudSync={() => setCloudSyncOpen(true)}
          onOpenShare={() => setShareOpen(true)}
          onOpenScripts={() => setScriptsOpen(true)}
          onOpenExtensions={() => setExtensionsOpen(true)}
          collaborators={collaborators}
          cloudAccounts={cloudAccounts}
          isSaving={isSaving}
          lastSavedText={lastSavedText}
        />
      )}

      {/* 2. Ribbon Bar (Toolbar) */}
      {!focusMode && (
        <Ribbon
          darkMode={darkMode}
          activeTab={activeRibbonTab}
          onTabChange={setActiveRibbonTab}
          onFormat={handleFormat}
          onInsertTable={handleInsertTable}
          onInsertImage={handleInsertImage}
          onInsertLink={handleInsertLink}
          onInsertEquation={() => {
            setSelectedExtensionId('math-equations');
            setExtensionsOpen(true);
          }}
          onInsertSignature={() => {
            setSelectedExtensionId('signature-pad');
            setExtensionsOpen(true);
          }}
          onInsertQr={() => {
            setSelectedExtensionId('qr-generator');
            setExtensionsOpen(true);
          }}
          onOpenFindReplace={() => setFindReplaceOpen(true)}
          onOpenScriptsModal={() => setScriptsOpen(true)}
          onRunActiveScript={handleRunApaScript}
          onOpenExtension={(extId) => {
            setSelectedExtensionId(extId);
            setExtensionsOpen(true);
          }}
          onToggleComments={() => setShowComments(!showComments)}
          onAddComment={handleAddComment}
          trackChangesActive={trackChangesActive}
          onToggleTrackChanges={() => setTrackChangesActive(!trackChangesActive)}
          onOpenWordStats={() => setWordStatsOpen(true)}
          pageSettings={pageSettings}
          onUpdatePageSettings={(newSet) => setPageSettings({ ...pageSettings, ...newSet })}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode(!focusMode)}
          showRuler={showRuler}
          onToggleRuler={() => setShowRuler(!showRuler)}
          showNavPane={showNavPane}
          onToggleNavPane={() => setShowNavPane(!showNavPane)}
          onOpenSymbolPicker={() => setSymbolPickerOpen(true)}
          onOpenReadAloud={() => setReadAloudOpen(true)}
          onOpenPrint={() => setPrintModalOpen(true)}
        />
      )}

      {/* 3. Main Document Canvas Workspace */}
      <DocumentCanvas
        darkMode={darkMode}
        content={content}
        onContentChange={handleContentChange}
        onFormat={handleFormat}
        onAddComment={handleAddComment}
        pageSettings={pageSettings}
        onUpdatePageSettings={(newSet) => setPageSettings({ ...pageSettings, ...newSet })}
        zoomLevel={zoomLevel}
        showRuler={showRuler && !focusMode}
        showNavPane={showNavPane && !focusMode}
        onCloseNavPane={() => setShowNavPane(false)}
        comments={comments}
        showComments={showComments && !focusMode}
        onCloseComments={() => setShowComments(false)}
        onResolveComment={(id) => {
          setComments(comments.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
        }}
        onDeleteComment={(id) => {
          setComments(comments.filter(c => c.id !== id));
        }}
        onReplyComment={(commentId, replyText) => {
          setComments(comments.map(c => {
            if (c.id === commentId) {
              const replies = c.replies || [];
              return {
                ...c,
                replies: [
                  ...replies,
                  {
                    id: `rep-${Date.now()}`,
                    author: 'Tú (Propietario)',
                    timestamp: 'Justo ahora',
                    text: replyText
                  }
                ]
              };
            }
            return c;
          }));
        }}
        collaborators={collaborators}
        trackChangesActive={trackChangesActive}
        editorRef={editorRef}
        nightCanvasMode={nightCanvasMode}
        onToggleNightCanvas={() => setNightCanvasMode(!nightCanvasMode)}
      />

      {/* 4. Bottom Status Bar */}
      <StatusBar
        darkMode={darkMode}
        wordCount={metadata.wordCount}
        charCount={metadata.charCount}
        pageCount={1}
        currentPage={1}
        language="Español (Alfabetización Internacional)"
        trackChangesActive={trackChangesActive}
        onToggleTrackChanges={() => setTrackChangesActive(!trackChangesActive)}
        cloudSyncStatus={lastSavedText}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onOpenWordStats={() => setWordStatsOpen(true)}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode(!focusMode)}
      />

      {/* Modals & Dialogs */}
      <BackstageModal
        isOpen={backstageOpen}
        onClose={() => setBackstageOpen(false)}
        darkMode={darkMode}
        onSelectTemplate={(tmpl) => {
          if (tmpl.id === 'blank' || !tmpl.content) {
            handleNewDocument();
          } else {
            setTitle(tmpl.name);
            setContent(tmpl.content);
            setHistory([tmpl.content]);
            setHistoryIndex(0);
            updateStats(tmpl.content);
            if (editorRef.current) {
              editorRef.current.innerHTML = tmpl.content;
            }
          }
          setPageSettings({ ...pageSettings, size: tmpl.pageSize, orientation: tmpl.orientation });
        }}
        onLoadDocument={(docTitle, docHtml) => {
          setTitle(docTitle);
          setContent(docHtml);
          setHistory([docHtml]);
          setHistoryIndex(0);
          updateStats(docHtml);
          if (editorRef.current) {
            editorRef.current.innerHTML = docHtml;
          }
        }}
        onSave={handleSave}
        onExport={handleExport}
        onPrint={() => setPrintModalOpen(true)}
        onOpenCloudSync={() => setCloudSyncOpen(true)}
        onOpenVersionHistory={() => setVersionHistoryOpen(true)}
        content={content}
        metadata={metadata}
        cloudAccounts={cloudAccounts}
      />

      <PrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title={title}
        content={content}
        pageSettings={pageSettings}
        metadata={metadata}
        darkMode={darkMode}
      />

      <CloudSyncModal
        isOpen={cloudSyncOpen}
        onClose={() => setCloudSyncOpen(false)}
        darkMode={darkMode}
        accounts={cloudAccounts}
        onUpdateAccounts={setCloudAccounts}
        onSyncNow={handleSyncAllClouds}
        isSyncing={isSyncing}
      />

      <ScriptEditorModal
        isOpen={scriptsOpen}
        onClose={() => setScriptsOpen(false)}
        darkMode={darkMode}
        content={content}
        onUpdateContent={(newHtml) => {
          handleContentChange(newHtml);
          if (editorRef.current) {
            editorRef.current.innerHTML = newHtml;
          }
        }}
      />

      <ExtensionsModal
        isOpen={extensionsOpen}
        onClose={() => setExtensionsOpen(false)}
        darkMode={darkMode}
        activeExtensionId={selectedExtensionId}
        content={content}
        onInsertHtml={(htmlToInsert) => {
          handleFormat('insertHTML', htmlToInsert);
        }}
        onReplaceContent={(newHtml) => {
          handleContentChange(newHtml);
          if (editorRef.current) {
            editorRef.current.innerHTML = newHtml;
          }
        }}
      />

      <FindReplaceModal
        isOpen={findReplaceOpen}
        onClose={() => setFindReplaceOpen(false)}
        darkMode={darkMode}
        content={content}
        onReplaceAll={(findTerm, replaceTerm, matchCase) => {
          const flags = matchCase ? 'g' : 'gi';
          const regex = new RegExp(findTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
          const updated = content.replace(regex, replaceTerm);
          handleContentChange(updated);
          if (editorRef.current) {
            editorRef.current.innerHTML = updated;
          }
        }}
      />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        darkMode={darkMode}
        documentTitle={title}
        collaborators={collaborators}
        onAddCollaborator={(name, email, role) => {
          const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2'];
          const pickedColor = colors[collaborators.length % colors.length];
          const newCollab: Collaborator = {
            id: `usr-${Date.now()}`,
            name,
            avatar: '',
            color: pickedColor,
            role,
            status: 'active',
            cursorPosition: { line: 1, x: 120, y: 150 }
          };
          setCollaborators(prev => [...prev, newCollab]);
        }}
      />

      <WordStatsModal
        isOpen={wordStatsOpen}
        onClose={() => setWordStatsOpen(false)}
        darkMode={darkMode}
        content={content}
      />

      <VersionHistoryModal
        isOpen={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        darkMode={darkMode}
        docId={metadata.id}
        currentTitle={title}
        currentContent={content}
        onRestoreVersion={(ver: DocumentVersion) => {
          setTitle(ver.title);
          handleContentChange(ver.htmlContent);
          if (editorRef.current) {
            editorRef.current.innerHTML = ver.htmlContent;
          }
        }}
      />

      <SymbolPickerModal
        isOpen={symbolPickerOpen}
        onClose={() => setSymbolPickerOpen(false)}
        darkMode={darkMode}
        onInsertSymbol={(symbol) => {
          handleFormat('insertHTML', symbol);
        }}
      />

      <ReadAloudWidget
        isOpen={readAloudOpen}
        onClose={() => setReadAloudOpen(false)}
        darkMode={darkMode}
        content={content}
      />
    </div>
  );
}
