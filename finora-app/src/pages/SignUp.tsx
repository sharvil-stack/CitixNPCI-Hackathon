import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from '../lib/router';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { ApiError, errMsg } from '../services/http';
import { ErrorNotice, Spinner } from '../components/ui/Feedback';
import { AuthLayout, AuthSwitch, EMAIL_RE, PasswordField, TextField, safeNext, validPassword } from '../components/ui/AuthForm';

type Errs = { fullName?: string; email?: string; password?: string };

export default function Signup() {
  const { t } = useLang();
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const next = safeNext(useSearchParams().get('next'));
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errs>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate(next, { replace: true }); }, [user]); // eslint-disable-line

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v: Errs = {};
    if (!fullName.trim()) v.fullName = t('auth.err.name');
    if (!EMAIL_RE.test(email.trim())) v.email = t('auth.err.email');
    if (!validPassword(password)) v.password = t('auth.err.pw');
    setErrors(v); setFormError('');
    if (Object.keys(v).length) return;
    setBusy(true);
    try { await register(fullName.trim(), email.trim(), password); }
    catch (err) {
      // Field-level problems from the server (validation_failed) are shown next to the field; everything else as a banner.
      if (err instanceof ApiError && err.fields) setErrors({ fullName: err.fields.fullName, email: err.fields.email, password: err.fields.password });
      else if (err instanceof ApiError && err.code === 'email_taken') setErrors({ email: err.message });
      else setFormError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout eyebrow={t('auth.signup.eyebrow')} title={t('auth.signup.title')} em={t('auth.signup.em')} sub={t('auth.signup.sub')}>
      <form className="stack" onSubmit={submit} noValidate>
        {formError && <ErrorNotice message={formError} />}
        <TextField id="fullName" label={t('auth.name')} autoComplete="name" autoFocus maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} />
        <TextField id="email" label={t('auth.email')} type="email" autoComplete="email" inputMode="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <PasswordField id="password" label={t('auth.password')} autoComplete="new-password" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} hint={t('auth.pw.hint')} />
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? <><Spinner /> {t('auth.working')}</> : t('auth.signup.submit')}</button>
        <AuthSwitch text={t('auth.haveAccount')} to={next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`} label={t('nav.login')} />
      </form>
    </AuthLayout>
  );
}
