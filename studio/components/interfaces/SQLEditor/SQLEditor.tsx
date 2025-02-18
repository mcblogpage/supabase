import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCallback } from 'react'
import Split from 'react-split'
import { getSqlEditorStateSnapshot, useSqlEditorStateSnapshot } from 'state/sql-editor'
import useLatest from 'hooks/misc/useLatest'
import MonacoEditor from './MonacoEditor'
import UtilityPanel from './UtilityPanel/UtilityPanel'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'

export interface SQLEditorProps {}

const SQLEditor = () => {
  const { ref, id } = useParams()
  const { project } = useProjectContext()
  const snap = useSqlEditorStateSnapshot()

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess(data) {
      if (id) snap.addResult(id, data.result)
    },
    onError(error) {
      if (id) snap.addResultError(id, error)
    },
  })

  const idRef = useLatest(id)

  const minSize = 44
  const snippet = id ? snap.snippets[id] : null
  const snapOffset = 50

  const isLoading = !(id && ref && snap.loaded[ref])
  const isUtilityPanelCollapsed = (snippet?.splitSizes?.[1] ?? 0) === 0

  const onDragEnd = useCallback((sizes: number[]) => {
    const id = idRef.current
    if (id) snap.setSplitSizes(id, sizes)
  }, [])

  const executeQuery = useCallback(
    (overrideSql?: string) => {
      // use the latest state
      const state = getSqlEditorStateSnapshot()
      const snippet = idRef.current && state.snippets[idRef.current]

      if (project && snippet && !isExecuting) {
        execute?.({
          projectRef: project.ref,
          connectionString: project.connectionString,
          sql: overrideSql ?? snippet.snippet.content.sql,
        })
      }
    },
    [isExecuting, project]
  )

  return (
    <div className="flex h-full flex-col">
      <Split
        style={{ height: '100%' }}
        direction="vertical"
        gutterSize={2}
        sizes={(snippet?.splitSizes as number[] | undefined) ?? [50, 50]}
        minSize={minSize}
        snapOffset={snapOffset}
        expandToMin={true}
        collapsed={isUtilityPanelCollapsed ? 1 : undefined}
        onDragEnd={onDragEnd}
      >
        <div className="dark:border-dark flex-grow overflow-y-auto border-b">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">Loading...</div>
          ) : (
            <MonacoEditor id={id!} isExecuting={isExecuting} executeQuery={executeQuery} />
          )}
        </div>

        <div className="flex flex-col">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">Loading...</div>
          ) : (
            <UtilityPanel id={id!} isExecuting={isExecuting} executeQuery={executeQuery} />
          )}
        </div>
      </Split>
    </div>
  )
}

export default SQLEditor
