import { useCallback, useEffect, useRef, useState } from 'react'
import { matchSchemes } from '../services/schemeService'

// Runs /api/match, cancels any outdated in-flight request, and keeps the last payload for retry.
export function useSchemeMatch() {
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  const ctl = useRef(null)
  const last = useRef(null)

  const run = useCallback(async (payload) => {
    ctl.current?.abort()
    const c = (ctl.current = new AbortController())
    last.current = payload
    setState((s) => ({ ...s, status: 'loading', error: null }))
    try {
      const data = await matchSchemes(payload, c.signal)
      setState({ status: 'success', data, error: null })
    } catch (e) {
      if (e.name === 'AbortError') return
      setState({ status: 'error', data: null, error: e })
    }
  }, [])

  const retry = useCallback(() => last.current && run(last.current), [run])
  useEffect(() => () => ctl.current?.abort(), [])
  return { ...state, run, retry }
}
