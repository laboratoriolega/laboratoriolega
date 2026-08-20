"use client";

import { useState } from "react";
import { Search, Save, X, Plus, Trash2, Edit, Copy } from "lucide-react";
import { createNota, updateNota, deleteNota } from "@/actions/listados";

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
  "#fef68a", // Yellow
  "#fbcfe8", // Pink
  "#bbf7d0", // Green
  "#bfdbfe", // Blue
  "#e9d5ff", // Purple
  "#fed7aa", // Orange
];

export default function NotesBoard({ data }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(data);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filteredItems = items.filter(item => 
    (item.titulo && item.titulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.contenido && item.contenido.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  async function handleSave(formData: FormData) {
    if (editingItem) {
      const res = await updateNota(editingItem.id, {
        titulo: formData.get("titulo"),
        contenido: formData.get("contenido"),
        color: formData.get("color")
      });
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

  async function handleCopy(item: any) {
    try {
      await navigator.clipboard.writeText(item.contenido);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
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
        gap: "1.5rem"
      }}>
        {filteredItems.map((item: any) => (
          <div key={item.id} style={{
            backgroundColor: item.color || "#fef68a",
            padding: "1.5rem",
            borderRadius: "4px",
            boxShadow: "2px 4px 12px rgba(0,0,0,0.1)",
            position: "relative",
            minHeight: "250px",
            display: "flex",
            flexDirection: "column",
            borderBottomRightRadius: "30px", // Folded corner effect
            color: "#333", // Dark text for pastel background
            fontFamily: "'Inter', sans-serif"
          }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "30px", height: "30px", background: "rgba(0,0,0,0.05)", borderBottomLeftRadius: "15px" }}></div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: "0.5rem", width: "100%" }}>
                {item.titulo}
              </h3>
            </div>
            
            <div 
              style={{ flex: 1, whiteSpace: "pre-wrap", overflowWrap: "break-word", fontSize: "0.95rem", lineHeight: "1.5" }}
              dangerouslySetInnerHTML={{ __html: formatWhatsAppText(item.contenido) }}
            />
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "0.5rem" }}>
              <button onClick={() => handleCopy(item)} style={{ color: copiedId === item.id ? "var(--success)" : "rgba(0,0,0,0.6)", padding: "4px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 600 }}>
                {copiedId === item.id ? "¡Copiado!" : <Copy size={16} />}
              </button>
              <button onClick={() => { setEditingItem(item); setShowModal(true); }} style={{ color: "rgba(0,0,0,0.6)", padding: "4px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "4px" }}>
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(item.id)} style={{ color: "#ef4444", padding: "4px", background: "transparent", border: "none", cursor: "pointer", borderRadius: "4px" }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
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
          <div className="glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "2rem", position: "relative" }}>
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
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>Color de Post-it</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {pastelColors.map(color => (
                    <label key={color} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <input 
                        type="radio" 
                        name="color" 
                        value={color} 
                        defaultChecked={editingItem ? editingItem.color === color : color === "#fef68a"}
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
    </div>
  );
}
