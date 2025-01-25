import { Flow } from '@flows-ai/ui'
import s from 'dedent'
import { useEffect, useState } from 'react'

const codeWrapping = (flow: string) => s`
  import { parallel } from 'https://esm.sh/flows-ai/flows';

  export default ${flow}
`

const initialFlow = s`parallel([
    {
      agent: 'githubAgent',
      input: 'Get me the latest commit message from the main branch of the flows-ai repo',
    }
  ])`

export function Sandbox() {
  const [code, setCode] = useState(initialFlow)
  const [result, setResult] = useState<any>(null)

  const evaluateCode = async () => {
    try {
      const blob = new Blob([codeWrapping(code)], { type: 'text/javascript' })
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
    <div className="grid grid-cols-2 gap-2 min-h-[50%]">
      <div className="grid grid-rows-2 gap-2 col-span-1">
        <textarea
          className="w-full"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={evaluateCode}
        />
        <div>
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      </div>
      <div className="w-full h-full not-content">{result && <Flow flow={result} />}</div>
    </div>
  )
}
