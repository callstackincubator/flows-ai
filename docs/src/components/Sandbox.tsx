import { javascript } from '@codemirror/lang-javascript'
import { Flow } from '@flows-ai/ui'
import { abyss } from '@uiw/codemirror-theme-abyss'
import ReactCodeMirror from '@uiw/react-codemirror'
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
      <ReactCodeMirror
        className="w-full"
        value={code}
        onChange={(value) => setCode(value)}
        onBlur={evaluateCode}
        basicSetup={{
          syntaxHighlighting: true,
        }}
        extensions={[javascript({ jsx: true, typescript: true })]}
        theme={abyss}
      />
      {result && (
        <div className="w-full h-[600px]">
          <Flow flow={result} />
        </div>
      )}
    </div>
  )
}
