import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from '../lib/router';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { ApiError, errMsg } from '../services/http';
import { ErrorNotice, Spinner } from '../components/ui/Feedback';
import { AuthLayout, AuthSwitch, EMAIL_RE, PasswordField, TextField, safeNext } from '../components/ui/AuthForm';

export default function Login() {
  const { t } = useLang();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const next = safeNext(useSearchParams().get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate(next, { replace: true }); }, [user]); // eslint-disable-line

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) v.email = t('auth.err.email');
    if (!password) v.password = t('auth.err.pwRequired');
    setErrors(v); setFormError('');
    if (Object.keys(v).length) return;
    setBusy(true);
    try { await login(email.trim(), password); }
    catch (err) { setFormError(err instanceof ApiError || err instanceof Error ? errMsg(err) : 'Something went wrong.'); setBusy(false); }
  }

  return (
    <AuthLayout eyebrow={t('auth.login.eyebrow')} title={t('auth.login.title')} em={t('auth.login.em')} sub={t('auth.login.sub')}>
      <form className="stack" onSubmit={submit} noValidate>
        {formError && <ErrorNotice message={formError} />}
        <TextField id="email" label={t('auth.email')} type="email" autoComplete="email" inputMode="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <PasswordField id="password" label={t('auth.password')} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? <><Spinner /> {t('auth.working')}</> : t('auth.login.submit')}</button>
        <AuthSwitch text={t('auth.noAccount')} to={next === '/' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`} label={t('nav.signup')} />
      </form>
    </AuthLayout>
  );
}
