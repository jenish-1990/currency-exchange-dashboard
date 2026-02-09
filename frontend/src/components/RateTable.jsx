import { useMemo, useCallback } from 'react';
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

const rateFormatter = (params) => {
  return params.value != null ? params.value.toFixed(6) : '';
};

const columnDefs = [
  { field: 'date', headerName: 'Date', filter: 'agTextColumnFilter', pinned: 'left' },
  { field: 'EUR_USD', headerName: 'EUR/USD', filter: 'agNumberColumnFilter', valueFormatter: rateFormatter },
  { field: 'EUR_CAD', headerName: 'EUR/CAD', filter: 'agNumberColumnFilter', valueFormatter: rateFormatter },
  { field: 'USD_EUR', headerName: 'USD/EUR', filter: 'agNumberColumnFilter', valueFormatter: rateFormatter },
  { field: 'CAD_EUR', headerName: 'CAD/EUR', filter: 'agNumberColumnFilter', valueFormatter: rateFormatter },
];

const defaultColDef = {
  flex: 1,
  minWidth: 120,
  filter: true,
  sortable: true,
  resizable: true,
};

const RateTable = ({ rowData, loading }) => {
  const initialState = useMemo(() => getSavedState(), []);

  const onStateUpdated = useCallback((event) => {
    localStorage.setItem(GRID_STATE_KEY, JSON.stringify(event.state));
  }, []);

  if (loading) {
    return (
      <div className="rate-table-container rate-table-loading">
        <span className="spinner" />
        Loading table...
      </div>
    );
  }

  return (
    <div className="rate-table-container">
      <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          initialState={initialState}
          onStateUpdated={onStateUpdated}
        />
      </div>
    </div>
  );
};

export default RateTable;
