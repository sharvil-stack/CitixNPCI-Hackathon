import { useAsync } from '../hooks/useAsync';
import { probeAll } from '../services/status';
import { SERVICE_LABEL, type ServiceName } from '../services/http';
import { Loading, Pill } from '../components/ui/Feedback';
import { Icon } from '../lib/icons';

const FAQ: [string, string][] = [
  ['Is FINORA giving me financial advice?', 'No. FINORA explains options and shows why a result appears. It cannot approve a scheme or card application, and you should confirm every detail with the official source.'],
  ['Can ScamShield tell me a message is safe?', 'No. It estimates risk and highlights warning signs. A low score does not guarantee safety. If anything feels off, contact your bank using the number on your card or its official app.'],
  ['What should I never share?', 'OTPs, PINs, passwords, CVV, full card numbers, Aadhaar or PAN. No genuine bank or government office will ask for these by message or call.'],
  ['A tool says a service is not running.', 'FINORA’s tools talk to separate backend services. The status panel below shows which ones are reachable; the README lists the command to start each.'],
  ['Why is some content in English when I picked Hindi or Marathi?', 'Each backend supports different languages. Content is shown in the selected language only where that service supports it.'],
];

export default function Help() {
  const st = useAsync(probeAll, []);
  return (
    <div className="page wrap" style={{ maxWidth: 920 }}>
      <div className="page-head"><span className="eyebrow">HELP</span><h1 className="display">Questions, answered plainly.</h1></div>
      <div className="stack" style={{ gap: 12 }}>
        {FAQ.map(([q, a]) => (
          <details key={q} className="card" style={{ padding: '18px 24px' }}>
            <summary style={{ cursor: 'pointer', fontFamily: 'var(--serif)', fontSize: 22, listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 12 }}>{q}<Icon name="chevron" /></summary>
            <p className="muted" style={{ marginTop: 12 }}>{a}</p>
          </details>
        ))}
      </div>
      <div className="panel" style={{ marginTop: 36 }}>
        <div className="row between"><h2 className="title-md">Service status</h2><button className="btn btn-sm" onClick={st.reload}><Icon name="refresh" size={15} />Check again</button></div>
        {st.loading ? <Loading label="Checking services…" /> : (
          <ul className="clean" style={{ marginTop: 18 }}>
            {(Object.keys(SERVICE_LABEL) as ServiceName[]).map((s) => (
              <li key={s} className="row between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <span>{SERVICE_LABEL[s]}</span>{st.data?.[s] ? <Pill kind="ok">Reachable</Pill> : <Pill kind="bad">Not reachable</Pill>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
