const fs = require('fs');
let content = fs.readFileSync('src/components/PrestacionesDashboard.tsx', 'utf8');

const funcs = `
  const handleDesignColorChange = (colKey: string, color: string, type: 'cell' | 'col') => {
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
          setData(prev => prev.map(r => r.id === headerRowId ? { ...r, row_data: updatedRowData } : r));
      }
      setDesignModeSectionId(null);
      setDesignData(null);
      setIsSaving(false);
  };
`;

const oldCreate = `  const handleCreateMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthTitle) return;
    setIsSaving(true);
    const rd = { "__EMPTY": newMonthTitle.toUpperCase(), "meta_part": "MONTH_TITLE", "__EMPTY_1": newMonthNote };
    await handleAddRow('Federacion-PAMI', rd, undefined);
    setIsMonthModalOpen(false);
    setNewMonthTitle('');
    setNewMonthNote('');
    setIsSaving(false);
  };`;

const newCreate = `  const handleCreateMonth = async (e: React.FormEvent) => {
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

// Insert funcs after updateHeaderColor
const oldUpdateHeader = `  const updateHeaderColor = async (headerRowId: number, colKey: string, color: string, type: 'cell' | 'col') => {
    const headerRow = data.find(r => r.id === headerRowId);
    if (!headerRow) return;
    const updatedRowData = { ...headerRow.row_data };
    if (type === 'cell') {
        updatedRowData[\`__cell_color_\${colKey}\`] = color;
    } else {
        updatedRowData[\`__col_color_\${colKey}\`] = color;
    }
    const res = await updatePrestacion(headerRowId, updatedRowData);
    if (res.success) {
        setData(prev => prev.map(r => r.id === headerRowId ? { ...r, row_data: updatedRowData } : r));
    }
  };`;

// Verify they exist
if (content.includes(oldCreate)) {
  content = content.replace(oldCreate, newCreate);
} else {
  console.log('oldCreate not found');
}

if (content.includes(oldUpdateHeader)) {
  content = content.replace(oldUpdateHeader, funcs);
} else {
  console.log('oldUpdateHeader not found');
}

fs.writeFileSync('src/components/PrestacionesDashboard.tsx', content);
console.log('Patch complete.');
