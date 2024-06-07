import { useEffect, useState } from 'react'
// Need to add the diff of https://github.com/sqlite/sqlite-wasm/pull/54 to index.d.ts of @sqlite.org/sqlite-wasm 
import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { SqliteRemoteDatabase, drizzle } from 'drizzle-orm/sqlite-proxy'
import './App.css'
import * as schema from './db/schema'

function App() {
  const [count, setCount] = useState(0)
  const [data, setData] = useState<{id: number, name: string|null}[]>([])
  const [db, setDb] = useState<SqliteRemoteDatabase<typeof schema>>()

  const initializeSQLite = async () => {
    try {
      console.log('Loading and initializing SQLite3 module...')
  
      const promiser = await sqlite3Worker1Promiser.v2()
  
      console.log('Done initializing. Running demo...')
  
      const configResponse = await promiser('config-get', {})
      if (configResponse.type !== 'error') {
        console.log('Running SQLite3 version', configResponse.result.version.libVersion)
      }
  
      const openResponse = await promiser('open', {
        filename: 'file:mydb.sqlite3?vfs=opfs',
      })
      if (openResponse.type === 'error') {
        console.error('Failed to open database:', openResponse.result.message)
        return
      }
      const { dbId } = openResponse
      console.log(
        'OPFS is available, created persisted database at',
        openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1'),
      )

      // Your SQLite code here.
      const result = await promiser('exec', {
        sql: 'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)',
        dbId: dbId,
      })
      if (result.type === 'error') {
        console.error('Failed to create table:', result.result.message)
        return
      }
      const result2 = await promiser('exec', {
        sql: 'INSERT INTO test (name) VALUES (?)',
        bind: ['Hello, World!'],
        dbId: dbId,
      })
      if (result2.type === 'error') {
        console.error('Failed to insert row:', result2.result.message)
        return
      }

      /* The result row is an array of values, each value representing a column data when the rowMode is 'array'
      const result3 = await promiser('exec', {
        sql: 'SELECT * FROM test',
        rowMode: 'array',
        dbId: dbId,
      })
      if (result3.type === 'error') {
        console.error('Failed to select rows:', result3.result.message)
        return
      }
      setData(result3.result.resultRows.map((row: any) => ({ id: row[0], name: row[1] })))
      //console.log(result3)
      */

      /** The result row is an object when the rowMode is 'object' */
      const result4 = await promiser('exec', {
        sql: 'SELECT * FROM test',
        rowMode: 'object',
        dbId: dbId,
      })
      if (result4.type === 'error') {
        console.error('Failed to select rows:', result4.result.message)
        return
      }
      //setData(result4.result.resultRows)
      //console.log(result4)

      const db = drizzle(async (sql, params, method) => {
        const result = await promiser('exec', {
          sql: sql,
          bind: params,
          dbId: dbId,
          rowMode: 'array',
        })
        if (result.type === 'error') {
          console.error('Failed to select rows:', result.result.message)
          return { rows: [] }
        }

        if (method === 'get') {
          return { rows: result.result.resultRows[0] }
        } else {
          return { rows: result.result.resultRows }
        }
      }, { schema: schema })
      setDb(db)

    } catch (err: any) {
      if (!(err instanceof Error)) {
        err = new Error(err.result.message)
      }
      console.error(err.name, err.message)
    }
  }

  useEffect(() => {
    initializeSQLite()
  }, [])

  const select = () => {
    db?.query.test.findMany().then((rows) => {
      setData(rows)
    })
  }

  return (
    <>
      <button onClick={select}>Select</button>
      { data.map((row) => <div key={row.id}>{row.id}: {row.name}</div>) }
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
