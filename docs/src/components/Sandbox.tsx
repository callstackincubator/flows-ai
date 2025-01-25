import { Flow } from '@flows-ai/ui'
import s from 'dedent'
import { useEffect, useState } from 'react'

const defaultCode = s`
  import { parallel } from 'https://esm.sh/flows-ai/flows';

  export default parallel([
    {
      agent: 'githubAgent',
      input: 'Get me the latest commit message from the main branch of the flows-ai repo',
    }
  ])
`

export function Sandbox() {
  const [code, setCode] = useState(defaultCode)
  const [result, setResult] = useState<any>(null)

  const evaluateCode = async () => {
    try {
      const blob = new Blob([code], { type: 'text/javascript' })
      const url = URL.createObjectURL(blob)
      /* vite-ignore */
      const module = await import(/* @vite-ignore */ url)
      setResult(module.default)

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      setResult(null)
    }
  }

  useEffect(() => {
    evaluateCode()
  }, [])

  return (
    <div className="grid grid-cols-2 gap-4 not-content">
      <div>
        <textarea value={code} onChange={(e) => setCode(e.target.value)} />
        <div>
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      </div>
      {result && (
        <div style={{ width: 600, height: 600 }}>
          <Flow flow={result} />
        </div>
      )}
    </div>
  )
}
