import type { ReactNode } from 'react';
import { Icon } from '../../lib/icons';

export const Spinner = () => <span className="spinner" role="status" aria-label="Loading" />;
export const Loading = ({ label = 'Loading…' }: { label?: string }) => <div className="loading" aria-live="polite"><Spinner /><span>{label}</span></div>;
export const Skeletons = ({ n = 3 }: { n?: number }) => <div className="grid g3" aria-hidden="true">{Array.from({ length: n }, (_, i) => <div key={i} className="skel" />)}</div>;

export function Notice({ kind = 'info', children, icon }: { kind?: 'info' | 'warn' | 'bad' | 'ok'; children: ReactNode; icon?: string }) {
  const ic = icon || (kind === 'bad' || kind === 'warn' ? 'alert' : kind === 'ok' ? 'check' : 'info');
  return <div className={`notice ${kind === 'info' ? '' : kind}`} role={kind === 'bad' ? 'alert' : 'status'}><Icon name={ic} size={18} /><div>{children}</div></div>;
}
export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="notice bad" role="alert"><Icon name="alert" size={18} />
      <div className="stack" style={{ gap: 10 }}><span>{message}</span>{onRetry && <div><button className="btn btn-sm" onClick={onRetry}><Icon name="refresh" size={15} /> Try again</button></div>}</div>
    </div>
  );
}
export const Empty = ({ title, children }: { title: string; children?: ReactNode }) => <div className="empty"><h3>{title}</h3>{children && <div>{children}</div>}</div>;
export const Pill = ({ kind = '', children }: { kind?: '' | 'ok' | 'warn' | 'bad'; children: ReactNode }) => <span className={`pill ${kind}`}>{children}</span>;
