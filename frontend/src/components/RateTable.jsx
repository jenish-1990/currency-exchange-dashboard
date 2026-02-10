import { useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { TextFilterModule } from 'ag-grid-community';
import { NumberFilterModule } from 'ag-grid-community';
import { GridStateModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './RateTable.css';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  GridStateModule,
]);

const GRID_STATE_KEY = 'agGridState';

const getSavedState = () => {
  try {
    const saved = localStorage.getItem(GRID_STATE_KEY);
    return saved ? JSON.parse(saved) : undefined;
  } catch {
    return undefined;
  }
};

const dateFormatter = (params) => {
  if (!params.value) return '';
  const [y, m, d] = params.value.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const rateFormatter = (params) => {
  return params.value != null ? params.value.toFixed(6) : '';
};

const rateColumn = (field, headerName) => ({
  field,
  headerName,
  filter: 'agNumberColumnFilter',
  valueFormatter: rateFormatter,
  cellStyle: { fontWeight: 600 },
});

const columnDefs = [
  { field: 'date', headerName: 'Date', filter: 'agTextColumnFilter', pinned: 'left', valueFormatter: dateFormatter },
  rateColumn('EUR_USD', 'EUR/USD'),
  rateColumn('USD_EUR', 'USD/EUR'),
  rateColumn('EUR_CAD', 'EUR/CAD'),
  rateColumn('CAD_EUR', 'CAD/EUR'),
];

const defaultColDef = {
  flex: 1,
  minWidth: 120,
  filter: true,
  sortable: true,
  resizable: true,
};

const RateTable = ({ rowData, loading, gridRef, onFilterChange }) => {
  const localRef = useRef(null);
  const ref = gridRef || localRef;
  const initialState = useMemo(() => getSavedState(), []);

  const onStateUpdated = useCallback((event) => {
    const state = { ...event.state };
    if (state.columnState) {
      delete state.columnState.columnSizing;
    }
    localStorage.setItem(GRID_STATE_KEY, JSON.stringify(state));
  }, []);

  const checkFilters = () => {
    if (!onFilterChange) return;
    const model = ref.current?.api?.getFilterModel();
    onFilterChange(model && Object.keys(model).length > 0);
  };

  if (loading) {
    return (
      <div className="table-wrap loading-state">
        <span className="spinner" />
        <span className="loading-text">Loading rates...</span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <div className="ag-theme-alpine-dark ag-dark-custom grid-container">
        <AgGridReact
          ref={ref}
          theme="legacy"
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          initialState={initialState}
          onStateUpdated={onStateUpdated}
          onFilterChanged={checkFilters}
        />
      </div>
    </div>
  );
};

export default RateTable;
