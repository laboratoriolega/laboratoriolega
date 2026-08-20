const fs = require('fs');
let content = fs.readFileSync('src/components/PrestacionesDashboard.tsx', 'utf8');

// 1. States
content = content.replace(
  'const [newMonthNote, setNewMonthNote] = useState("");',
  'const [newMonthNote, setNewMonthNote] = useState("");\n  const [editingMonthId, setEditingMonthId] = useState<number | null>(null);\n  const [designModeSectionId, setDesignModeSectionId] = useState<number | null>(null);\n  const [designData, setDesignData] = useState<any>(null);'
);

// 2. updateHeaderColor -> handleDesignColorChange & handleSaveDesign
const oldUpdateHeader = /const updateHeaderColor = async \([^]*?setData\(prev => prev\.map\(r => r\.id === headerRowId \? \{ \.\.\.r, row_data: updatedRowData \} : r\)\);\n    \}\n  \};/;
const newUpdateHeader = `const handleDesignColorChange = (colKey: string, color: string, type: 'cell' | 'col') => {
      setDesignData((prev: any) => ({
          ...prev,
          [type === 'cell' ? \`__cell_color_\${colKey}\` : \`__col_color_\${colKey}\`]: color
      }));
  };

  const handleSaveDesign = async (headerRowId: number) => {
      const headerRow = data.find(r => r.id === headerRowId);
      if (!headerRow) return;
      setIsSaving(true);
      const updatedRowData = { ...headerRow.row_data, ...designData };
      const res = await updatePrestacion(headerRowId, updatedRowData);
      if (res.success) {
          setData((prev: any[]) => prev.map(r => r.id === headerRowId ? { ...r, row_data: updatedRowData } : r));
      }
      setDesignModeSectionId(null);
      setDesignData(null);
      setIsSaving(false);
  };`;
content = content.replace(oldUpdateHeader, newUpdateHeader);

// 3. handleCreateMonth
const oldCreateMonth = /const handleCreateMonth = async \([^]*?setIsSaving\(false\);\n  \};/;
const newCreateMonth = `const handleCreateMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthTitle) return;
    setIsSaving(true);
    const rd = { "__EMPTY": newMonthTitle.toUpperCase(), "meta_part": "MONTH_TITLE", "__EMPTY_1": newMonthNote };
    if (editingMonthId !== null) {
       await updatePrestacion(editingMonthId, rd);
    } else {
       await handleAddRow('Federacion-PAMI', rd, undefined);
    }
    const freshRes = await getPrestacionesBySheet(activeSheet);
    if (freshRes.success) setData(freshRes.data || []);
    setIsMonthModalOpen(false);
    setNewMonthTitle('');
    setNewMonthNote('');
    setEditingMonthId(null);
    setIsSaving(false);
  };

  const openEditMonth = (monthId: number, currentName: string, currentNote: string) => {
    setEditingMonthId(monthId);
    setNewMonthTitle(currentName);
    setNewMonthNote(currentNote || '');
    setIsMonthModalOpen(true);
  };`;
content = content.replace(oldCreateMonth, newCreateMonth);

// 4. Modal title
content = content.replace(
  '<h2 style={{ fontSize: \'1.5rem\', fontWeight: 800, marginBottom: \'1.5rem\', color: \'var(--primary)\' }}>Crear Nuevo Mes</h2>',
  '<h2 style={{ fontSize: \'1.5rem\', fontWeight: 800, marginBottom: \'1.5rem\', color: \'var(--primary)\' }}>{editingMonthId !== null ? \'Editar Mes\' : \'Crear Nuevo Mes\'}</h2>'
);
content = content.replace(
  '<button type="submit" className="btn-primary" style={{ flex: 1, padding: \'0.75rem\' }} disabled={isSaving}>Crear Mes</button>',
  '<button type="submit" className="btn-primary" style={{ flex: 1, padding: \'0.75rem\' }} disabled={isSaving}>{editingMonthId !== null ? \'Guardar Cambios\' : \'Crear Mes\'}</button>'
);
content = content.replace(
  '<button type="button" onClick={() => setIsMonthModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: \'0.75rem\' }}>Cancelar</button>',
  '<button type="button" onClick={() => { setIsMonthModalOpen(false); setEditingMonthId(null); }} className="btn-secondary" style={{ flex: 1, padding: \'0.75rem\' }}>Cancelar</button>'
);

// 5. Accordion Header
const oldAccHeader = `<div style={{ color: 'var(--primary)', fontWeight: 700 }}>
                {expandedMonths[month] ? 'Ocultar ▲' : 'Ver Detalles ▼'}
              </div>`;
const newAccHeader = `<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditMonth(groupedByMonth[month][0].monthId, month, groupedByMonth[month][0].monthNote); }}
                  className="btn-small-secondary"
                  style={{ background: 'white' }}
                >
                  <Edit2 size={14} /> Editar Mes
                </button>
                <div style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  {expandedMonths[month] ? 'Ocultar ▲' : 'Ver Detalles ▼'}
                </div>
              </div>`;
content = content.replace(oldAccHeader, newAccHeader);

// 6. Section buttons
const oldSectionBtns = /<button onClick=\{\(\) => openEditModal\(section\)\} className="btn-small-secondary"><Settings size=\{14\} \/> <span>Editar Tabla<\/span><\/button>/;
const newSectionBtns = `<button 
               onClick={() => {
                   if (designModeSectionId === section.structuralIds.header) {
                       handleSaveDesign(section.structuralIds.header);
                   } else {
                       setDesignModeSectionId(section.structuralIds.header);
                       const hd = data.find(r => r.id === section.structuralIds.header)?.row_data || {};
                       setDesignData(hd);
                   }
               }} 
               className={designModeSectionId === section.structuralIds.header ? "btn-small-primary" : "btn-small-secondary"}
               style={designModeSectionId === section.structuralIds.header ? { backgroundColor: 'var(--success)', color: 'white' } : {}}
            >
               <Palette size={14} /> <span>{designModeSectionId === section.structuralIds.header ? "Guardar Colores" : "🎨 Diseño"}</span>
            </button>
            <button onClick={() => openEditModal(section)} className="btn-small-secondary"><Settings size={14} /> <span>Editar Tabla</span></button>`;
content = content.replace(oldSectionBtns, newSectionBtns);

// 7. TH
const oldTH = /\{isExcelSheet && editingRow !== null && \([^]*?\}\)/;
const newTH = `{designModeSectionId === section.structuralIds.header && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              type="color" 
                              title="Color del nombre (celda)" 
                              value={designData?.[\`__cell_color_\${h}\`] || section.headerCellColors?.[h] || "#ffffff"} 
                              onChange={(e) => handleDesignColorChange(h, e.target.value, 'cell')} 
                              style={{ width: '16px', height: '16px', padding: 0, border: 'none', cursor: 'pointer' }} 
                            />
                            <input 
                              type="color" 
                              title="Color de TODA la columna" 
                              value={designData?.[\`__col_color_\${h}\`] || section.colColors?.[h] || "#ffffff"} 
                              onChange={(e) => handleDesignColorChange(h, e.target.value, 'col')} 
                              style={{ width: '16px', height: '16px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '50%' }} 
                            />
                          </div>
                        )}`;
content = content.replace(oldTH, newTH);

// 8. TD
const oldTD = /const colColor = section\.colColors\?\.\[h\];/;
const newTD = `const colColor = designModeSectionId === section.structuralIds.header && designData?.[\`__col_color_\${h}\`] 
                                        ? designData[\`__col_color_\${h}\`] 
                                        : section.colColors?.[h];`;
content = content.replace(oldTD, newTD);

fs.writeFileSync('src/components/PrestacionesDashboard.tsx', content);
console.log('Done!');
