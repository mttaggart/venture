import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { PageResult, ColumnMap, Column } from "./types";
import { homeDir } from '@tauri-apps/api/path';
import { open } from "@tauri-apps/plugin-dialog";
import ColumnSelector from "./ColumnSelector";
import CurrentFilters from "./CurrentFilters";
import EventTable from "./EventTable";

import "./App.css";

const DEFAULT_PAGE_SIZE = 10;

function App() {
  // const [selectedFile, setSelectedFile] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [events, setEvents]: [Object[], Function] = useState([]);
  const [columns, setColumns]: [ColumnMap, Function] = useState({});
  const [totalEvents, setTotalEvents]: [number, Function] = useState(0);
  const [pageSize, setPageSize]: [number, Function] = useState(DEFAULT_PAGE_SIZE);

  async function getPage(selected: number) {
    let res: PageResult = await invoke("select_page", { selected });
    setCurrentPage(res.page_num);
    setEvents(res.events);
  }

  async function getFile() {
    const selected = await open({
      directory: false,
      multiple: false,
      defaultPath: await homeDir(),
      title: "Select Event File",
      filters: [{
        extensions: ["evtx"],
        name: ""
      }]
    });

    let res: PageResult = await invoke("load_evtx", { selected });
    let events: Object[] = await res.events;
    let columns: ColumnMap = {}; 
    Object.keys(events[0]).forEach((c: string) => {
      columns[c] = { 
        name: c,
        selected: true,
        filter: ""
      }
    });

    console.log(events);

    setCurrentPage(res.page_num);
    setTotalEvents(res.total_events);
    setPageSize(res.page_size);
    setEvents(events);
    setColumns(columns);
  }

  const setFilter = (columnName: string, filter: string) => {
    console.log(`Updating ${columnName}`)
    let oldCol: Column = columns[columnName];
    let newCol: Column = {
      name: oldCol.name,
      selected: oldCol.selected,
      filter: oldCol.filter + filter
    };
    console.log(newCol.filter);
    setColumns({...columns, columnName: newCol});
  }


  return (
    <main className="container">
      <h1>Venture</h1>
      <button type="button" onClick={async () =>{await getFile()}}>Open</button>
      {
        events.length > 0 ?
        <>
          <ColumnSelector columns={columns} setColumns={setColumns} />
          <CurrentFilters columns={columns} />
          <EventTable events={events} columns={columns} setFilter={setFilter}/>
          <div className="paginator">
            <p>
              <button 
                className="paginate prev" 
                disabled={currentPage == 1} 
                onClick={() => getPage(currentPage - 1)}
              >
                &lt; 
              </button>
              Page {currentPage} of { Math.ceil(totalEvents / pageSize) } 
              <button 
                className="paginate next" 
                disabled={currentPage === (Math.ceil(totalEvents / pageSize))} 
                onClick={() => getPage(currentPage + 1)}
              > 
                &gt;
              </button>
            </p>
          </div>
        </>
        : null
      }
    </main>
  );
}

export default App;
