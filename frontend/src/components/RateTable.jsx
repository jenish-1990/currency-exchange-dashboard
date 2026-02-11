import { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  RowApiModule,
  TextFilterModule,
  NumberFilterModule,
  GridStateModule,
  CsvExportModule,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { formatDisplayDate } from '../utils/transformData';
import './RateTable.css';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  RowApiModule,
  TextFilterModule,
  NumberFilterModule,
  GridStateModule,
  CsvExportModule,
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
  return params.value ? formatDisplayDate(params.value) : '';
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

const RateTable = ({ rowData, gridRef, onFilterChange }) => {
  const initialState = useMemo(() => getSavedState(), []);

  const onStateUpdated = useCallback((event) => {
    const state = { ...event.state };
    // skip column sizing
    if (state.columnState) {
      delete state.columnState.columnSizing;
    }
    localStorage.setItem(GRID_STATE_KEY, JSON.stringify(state));
  }, []);

  const checkFilters = useCallback((event) => {
    if (!onFilterChange) return;
    const model = event.api.getFilterModel();
    const isFiltered = model && Object.keys(model).length > 0;
    onFilterChange(isFiltered, isFiltered ? event.api.getDisplayedRowCount() : null);
  }, [onFilterChange]);

  return (
    <div className="table-wrap">
      <div className="ag-theme-alpine-dark ag-dark-custom grid-container">
        <AgGridReact
          ref={gridRef}
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
