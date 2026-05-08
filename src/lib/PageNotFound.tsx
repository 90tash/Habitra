import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center space-y-4">
        <p className="text-6xl">🧭</p>
        <h1 className="text-xl font-bold font-space">Page Not Found</h1>
        <p className="text-sm text-muted-foreground">This page doesn't exist</p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}