import { Link } from '../lib/router';
export default function NotFound() {
  return <div className="page wrap" style={{ textAlign: 'center', padding: '100px 24px' }}><span className="eyebrow">404</span><h1 className="display" style={{ margin: '18px 0' }}>This page doesn’t exist.</h1><Link to="/" className="btn btn-primary">Back to home</Link></div>;
}
