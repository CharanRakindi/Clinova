import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        You do not have the necessary permissions to view this page. If you believe this is an error, please contact your administrator.
      </p>
      <Link to="/" className="btn btn-primary px-6 py-2">
        Return Home
      </Link>
    </div>
  );
};

export default Unauthorized;
