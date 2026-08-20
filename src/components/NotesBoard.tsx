"use client";

import { useState } from "react";
import { Search, Save, X, Plus, Trash2, Edit, Copy, Paperclip, FileIcon, Download, Eye } from "lucide-react";
import { createNota, updateNota, deleteNota, deleteNotaDocument } from "@/actions/listados";

function formatWhatsAppText(text: string) {
  if (!text) return "";
  
  // Basic markdown parsing for WhatsApp style
  // *bold*
  let formatted = text.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
  // _italic_
  formatted = formatted.replace(/_([^_]+)_/g, "<em>$1</em>");
  // ~strikethrough~
  formatted = formatted.replace(/~([^~]+)~/g, "<del>$1</del>");
  // Newlines
  formatted = formatted.replace(/\n/g, "<br />");
  
  return formatted;
}

const pastelColors = [
  "#FFF9C4", // Yellow (Soft)
  "#FCE4EC", // Pink (Soft)
  "#E8F5E9", // Green (Soft)
  "#E3F2FD", // Blue (Soft)
  "#F3E5F5", // Purple (Soft)
  "#FFF3E0", // Orange (Soft)
];

function isImage(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
}

function NoteCard({ item, onEdit, onDelete, onViewFile }: { item: any, onEdit: () => void, onDelete: () => void, onViewFile: (doc: any) => void }) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  async function handleCopy(item: any) {
    try {
      await navigator.clipboard.writeText(item.contenido);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }

  // Determine if content is too long
  const MAX_CHARS = 250;
  const isLong = item.contenido && item.contenido.length > MAX_CHARS;
  const displayContent = isLong && !isExpanded 
    ? item.contenido.substring(0, MAX_CHARS) + "..."
    : item.contenido;

  const docs = item.documents && typeof item.documents === 'string' ? JSON.parse(item.documents) : (item.documents || []);

  return (
    <div style={{
      backgroundColor: item.color || "#FFF9C4",
      padding: "1.5rem",
      borderRadius: "4px",
      boxShadow: "2px 4px 12px rgba(0,0,0,0.1)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      borderBottomRightRadius: "30px", // Folded corner effect
      color: "#333", // Dark text for pastel background
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: "30px", height: "30px", background: "rgba(0,0,0,0.05)", borderBottomLeftRadius: "15px" }}></div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: "0.5rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, paddingRight: "1rem", wordBreak: "break-word" }}>
          {item.titulo}
        </h3>
        <div style={{ display: "flex", gap: "0.25rem", zIndex: 10 }}>
          <button onClick={() => handleCopy(item)} style={{ color: copiedId === item.id ? "var(--success)" : "rgba(0,0,0,0.6)", padding: "4px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 600 }} title="Copiar">
            {copiedId === item.id ? "¡Copiado!" : <Copy size={16} />}
          </button>
          <button onClick={onEdit} style={{ color: "rgba(0,0,0,0.6)", padding: "4px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "4px" }} title="Editar">
            <Edit size={16} />
          </button>
          <button onClick={onDelete} style={{ color: "#ef4444", padding: "4px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "4px" }} title="Eliminar">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <div 
          style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word", fontSize: "0.95rem", lineHeight: "1.5" }}
          dangerouslySetInnerHTML={{ __html: formatWhatsAppText(displayContent) }}
        />
        {isLong && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              marginTop: "0.5rem",
              background: "none", border: "none", color: "var(--primary)",
              fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", padding: 0
            }}
          >
            {isExpanded ? "Ocultar" : "Ver Más"}
          </button>
        )}
      </div>

      {docs.length > 0 && (
        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {docs.map((doc: any) => (
            <button 
              key={doc.id}
              onClick={() => onViewFile(doc)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.5rem", background: "rgba(255,255,255,0.5)",
                borderRadius: "6px", border: "1px solid rgba(0,0,0,0.05)",
                cursor: "pointer", textAlign: "left", fontSize: "0.85rem",
                color: "#333", transition: "background 0.2s"
              }}
            >
              {isImage(doc.filename) ? <Eye size={16} color="var(--primary)" /> : <FileIcon size={16} color="var(--primary)" />}
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {doc.filename}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotesBoard({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(data);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // File viewer modal state
  const [viewFile, setViewFile] = useState<any>(null);

  const filteredItems = items.filter(item => 
    (item.titulo && item.titulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.contenido && item.contenido.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  async function handleSave(formData: FormData) {
    if (editingItem) {
      const res = await updateNota(editingItem.id, formData);
      if (!res.error) window.location.reload();
      else alert(res.error);
    } else {
      const res = await createNota(formData);
      if (!res.error) window.location.reload();
      else alert(res.error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar esta nota?")) return;
    const res = await deleteNota(id);
    if (!res.error) {
      setItems(items.filter((it: any) => it.id !== id));
    }
  }

  async function handleDeleteDocument(docId: number, notaId: number) {
    if (!confirm("¿Eliminar este archivo adjunto?")) return;
    const res = await deleteNotaDocument(docId);
    if (!res.error) {
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <div className="glass-panel" style={{ flex: 1, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Search size={20} style={{ color: "var(--text-muted)" }} />
          <input 
            className="input-field" 
            placeholder="Buscar en notas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: "none", background: "transparent", boxShadow: "none", padding: 0 }}
          />
        </div>
        <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
          <Plus size={18} /> Nueva Nota
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.5rem",
        alignItems: "start"
      }}>
        {filteredItems.map((item: any) => (
          <NoteCard 
            key={item.id} 
            item={item} 
            onEdit={() => { setEditingItem(item); setShowModal(true); }}
            onDelete={() => handleDelete(item.id)}
            onViewFile={setViewFile}
          />
        ))}
        {filteredItems.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--text-muted)", background: "var(--glass-bg)", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
            No se encontraron notas
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "2rem", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X size={24} />
            </button>
            <h2 style={{ marginTop: 0, marginBottom: "1.5rem" }}>{editingItem ? "Editar Nota" : "Nueva Nota"}</h2>
            
            <form action={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>Título</label>
                <input name="titulo" required defaultValue={editingItem?.titulo} className="input-field" placeholder="Título de la nota" />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>Contenido</label>
                <textarea 
                  name="contenido" 
                  required 
                  defaultValue={editingItem?.contenido} 
                  className="input-field" 
                  placeholder="Escribe aquí... usa *negrita*, _cursiva_ o ~tachado~"
                  style={{ minHeight: "150px", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>Adjuntar Archivos / Imágenes</label>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <label style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "var(--glass-bg)", border: "1px dashed var(--glass-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    <Paperclip size={16} /> Subir Archivos
                    <input type="file" name="documents" multiple style={{ display: "none" }} />
                  </label>
                </div>
                
                {editingItem?.documents && (
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Archivos Actuales:</p>
                    {JSON.parse(editingItem.documents).map((doc: any) => (
                      <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", background: "rgba(0,0,0,0.02)", borderRadius: "4px", border: "1px solid rgba(0,0,0,0.05)" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "1rem" }}>{doc.filename}</span>
                        <button type="button" onClick={() => handleDeleteDocument(doc.id, editingItem.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", padding: "4px" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>Color de Post-it</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {pastelColors.map(color => (
                    <label key={color} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <input 
                        type="radio" 
                        name="color" 
                        value={color} 
                        defaultChecked={editingItem ? editingItem.color === color : color === "#FFF9C4"}
                        style={{ display: "none" }}
                      />
                      <div style={{ 
                        width: "30px", height: "30px", borderRadius: "50%", background: color,
                        border: "2px solid var(--glass-border)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }} 
                      onClick={(e) => {
                        const siblings = e.currentTarget.parentElement?.parentElement?.children;
                        if (siblings) {
                          for (let i = 0; i < siblings.length; i++) {
                            (siblings[i].children[1] as HTMLElement).style.border = "2px solid var(--glass-border)";
                          }
                        }
                        e.currentTarget.style.border = "2px solid var(--primary)";
                      }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewFile && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100
        }} onClick={() => setViewFile(null)}>
          <div className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "90%", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{viewFile.filename}</h3>
              <button onClick={() => setViewFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", alignItems: "center", background: "var(--bg-main)", borderRadius: "8px", minHeight: "200px" }}>
              {isImage(viewFile.filename) ? (
                <img src={viewFile.url} alt={viewFile.filename} style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }} />
              ) : (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <FileIcon size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                  <p>Vista previa no disponible para este formato.</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <button 
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(viewFile.url);
                    alert("Enlace copiado al portapapeles");
                  } catch (e) {
                    console.error("Error copiando", e);
                  }
                }}
                className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Copy size={16} /> Copiar Enlace
              </button>
              <a href={viewFile.url} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Download size={16} /> Descargar
                </button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
