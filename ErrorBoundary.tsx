import React, { useState, useEffect, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

export function ErrorBoundary({ children }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleReset = () => {
    setHasError(false);
    setError(null);
    window.location.reload();
  };

  if (hasError) {
    let errorMessage = "Ceva nu a mers bine. Te rugăm să încerci din nou.";
    
    try {
      if (error?.message) {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.includes('permissions')) {
          errorMessage = "Nu ai permisiunile necesare pentru această acțiune.";
        }
      }
    } catch (e) {
      // Not a JSON error
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full border-red-100 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">Ups! Eroare</CardTitle>
            <CardDescription className="mt-2 text-slate-600">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-8">
            <Button onClick={handleReset} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reîncărcare aplicație
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
