const fs = require('fs');
let content = fs.readFileSync('src/components/PrestacionesDashboard.tsx', 'utf8');

// 1. Remove Federacion-PAMI from COTIZADOR_SUBTABS
const oldSubtabs = `const COTIZADOR_SUBTABS = [
  { label: 'Federacion PAMI', sheet: 'Federacion-PAMI' },
  { label: 'Cotizador', sheet: 'Cotizador' },
  { label: 'Convenios Particulares', sheet: 'Convenios Particulares' },
];`;
const newSubtabs = `const COTIZADOR_SUBTABS = [
  { label: 'Cotizador', sheet: 'Cotizador' },
  { label: 'Convenios Particulares', sheet: 'Convenios Particulares' },
];`;
content = content.replace(oldSubtabs, newSubtabs);

// 2. Update state definitions
const oldState = `  const [activeMainTab, setActiveMainTab] = useState<'general' | 'cotizador'>('general');
  const [activeCotizadorSubTab, setActiveCotizadorSubTab] = useState<string>('Federacion-PAMI');

  // La sheet activa se deriva de las pestañas
  const activeSheet: string = activeMainTab === 'general' ? 'Delgado' : activeCotizadorSubTab;`;
const newState = `  const [activeMainTab, setActiveMainTab] = useState<'general' | 'federacion_pami' | 'cotizador'>('general');
  const [activeCotizadorSubTab, setActiveCotizadorSubTab] = useState<string>('Cotizador');

  // La sheet activa se deriva de las pestañas
  const activeSheet: string = activeMainTab === 'general' ? 'Delgado' : activeMainTab === 'federacion_pami' ? 'Federacion-PAMI' : activeCotizadorSubTab;`;
content = content.replace(oldState, newState);

// 3. Update Nuevo Mes condition
const oldNuevoMes = `{activeMainTab === 'cotizador' && activeCotizadorSubTab === 'Federacion-PAMI' && (`;
const newNuevoMes = `{activeMainTab === 'federacion_pami' && (`;
content = content.replace(oldNuevoMes, newNuevoMes);

// 4. Update Main Tabs HTML
const oldTabsHTML = `<button
          onClick={() => { setActiveMainTab('general'); setSearch(''); }}
          className={activeMainTab === 'general' ? 'tab-active' : 'tab-inactive'}
        >General</button>
        <button
          onClick={() => { setActiveMainTab('cotizador'); setSearch(''); }}
          className={activeMainTab === 'cotizador' ? 'tab-active' : 'tab-inactive'}
        >Cotizador</button>`;
const newTabsHTML = `<button
          onClick={() => { setActiveMainTab('general'); setSearch(''); }}
          className={activeMainTab === 'general' ? 'tab-active' : 'tab-inactive'}
        >GENERAL</button>
        <button
          onClick={() => { setActiveMainTab('federacion_pami'); setSearch(''); }}
          className={activeMainTab === 'federacion_pami' ? 'tab-active' : 'tab-inactive'}
        >FEDERACION PAMI</button>
        <button
          onClick={() => { setActiveMainTab('cotizador'); setSearch(''); }}
          className={activeMainTab === 'cotizador' ? 'tab-active' : 'tab-inactive'}
        >COTIZADOR</button>`;
content = content.replace(oldTabsHTML, newTabsHTML);

// 5. Update COTIZADOR_SUBTABS labels map in search
const oldLabels = `'Federacion-PAMI': 'Federacion PAMI',
      'Cotizador': 'Cotizador (Maria Andrea Delgado)',
      'Convenios Particulares': 'Convenios Particulares',`;
const newLabels = `'Cotizador': 'Cotizador (Maria Andrea Delgado)',
      'Convenios Particulares': 'Convenios Particulares',`;
content = content.replace(oldLabels, newLabels);

fs.writeFileSync('src/components/PrestacionesDashboard.tsx', content);
console.log('Patch complete.');
