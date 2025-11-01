import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Page not found</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
