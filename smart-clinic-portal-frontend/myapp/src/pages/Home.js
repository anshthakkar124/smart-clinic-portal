import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Stethoscope, 
  Calendar, 
  FileText, 
  Shield, 
  Clock, 
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: Stethoscope,
      title: 'Self Check-in',
      description: 'Complete your health assessment before your appointment to save time and provide better care.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Schedule appointments with your preferred doctors at convenient times.',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: FileText,
      title: 'Digital Prescriptions',
      description: 'Access your prescriptions online and download them as PDF files.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health information is protected with enterprise-grade security.',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'Get instant notifications about appointment changes and reminders.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      icon: Users,
      title: 'Expert Care',
      description: 'Connect with qualified healthcare professionals in your area.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  const benefits = [
    'Reduce waiting time at the clinic',
    'Access your medical records anytime',
    'Get appointment reminders via email/SMS',
    'Download prescriptions instantly',
    'Track your health history',
    'Secure and HIPAA compliant'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">Smart Clinic Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
                  <Link
                    to="/dashboard"
                    className="btn-primary"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Smart Patient
              <span className="text-primary-600"> Self-Check Portal</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your healthcare experience with our comprehensive self-service portal. 
              Check in, book appointments, and manage your health records all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
  {!isAuthenticated && (
    <>
      <Link
        to="/register"
        className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2"
      >
        Get Started Today
        <ArrowRight className="h-5 w-5" />
      </Link>
      <Link
        to="/login"
        className="btn-secondary text-lg px-8 py-3 flex items-center justify-center gap-2"
      >
        Sign In
      </Link>
    </>
  )}
  {isAuthenticated && (
    <Link
      to="/dashboard"
      className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2"
    >
      Go to Dashboard
      <ArrowRight className="h-5 w-5" />
    </Link>
  )}
</div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Better Healthcare
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to manage your healthcare efficiently and effectively.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card hover:shadow-lg transition-shadow duration-300">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose Our Platform?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We're committed to making healthcare more accessible, efficient, and patient-friendly. 
                Our platform is designed with both patients and healthcare providers in mind.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600 mb-6 text-center">
                Join thousands of patients who are already using our platform to manage their healthcare.
              </p>
              {!isAuthenticated && (
                <div className="space-y-4">
                  <Link
                    to="/register"
                    className="btn-primary w-full text-center block"
                  >
                    Create Your Account
                  </Link>
                  <Link
                    to="/login"
                    className="btn-secondary w-full text-center block"
                  >
                    Sign In to Existing Account
                  </Link>
                </div>
              )}
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="btn-primary w-full text-center block"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Stethoscope className="h-8 w-8 text-primary-400" />
                <h3 className="ml-2 text-xl font-bold">Smart Clinic Portal</h3>
              </div>
              <p className="text-gray-400">
                Empowering patients with smart healthcare solutions.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white">Login</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">
                Email: support@smartclinic.com<br />
                Phone: (555) 123-4567
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Smart Clinic Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
