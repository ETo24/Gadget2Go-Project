import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <p className="font-heading text-7xl font-bold gradient-text">404</p>
        <h1 className="mt-2 font-heading text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block"><Button className="rounded-full bg-navy hover:bg-navy-700">Back to home</Button></Link>
      </div>
    </div>
  );
}
