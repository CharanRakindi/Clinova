import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Clock, Users, ArrowRight, Stethoscope, Lock } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-hidden selection:bg-primary-200">
      {/* Navbar */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
          <div className="flex lg:flex-1 items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-primary-500/20">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
              MediVault
            </span>
          </div>
          <div className="flex flex-1 justify-end gap-4 items-center">
            <Link to="/login" className="text-sm font-semibold leading-6 text-slate-700 hover:text-primary-600 transition-colors">
              Log in
            </Link>
            <Link to="/register" className="text-sm font-semibold leading-6 text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-full shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <div className="relative isolate pt-14">
          {/* Background Gradient Mesh */}
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
          </div>

          <div className="py-24 sm:py-32 lg:pb-40">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center animate-fade-in-up">
                <div className="mb-8 flex justify-center">
                  <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-slate-900/20 bg-white/50 backdrop-blur-sm cursor-pointer transition-all hover:scale-105">
                    Announcing our next-gen platform. <a href="#" className="font-semibold text-primary-600"><span className="absolute inset-0" aria-hidden="true"></span>Read more <span aria-hidden="true">&rarr;</span></a>
                  </div>
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl mb-8">
                  Healthcare Management, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Reimagined.</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-600 max-w-xl mx-auto font-medium">
                  The most secure, intuitive platform for patients and doctors to manage medical records, appointments, and care plans seamlessly.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    to="/register"
                    className="group flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/30 hover:bg-primary-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    Start your journey
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/login" className="text-sm font-semibold leading-6 text-slate-900 hover:text-primary-600 transition-colors">
                    Log in to portal <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="mt-24 mx-auto max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <div className="glass-card p-8 hover:-translate-y-2 transition-all duration-300 animate-fade-in-up animation-delay-100 group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Enterprise Security</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      End-to-end encryption for all medical records with role-based access control and HIPAA compliance built-in.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="glass-card p-8 hover:-translate-y-2 transition-all duration-300 animate-fade-in-up animation-delay-200 group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Doctor Dashboard</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Intuitive interface for doctors to manage patients, appointments, and securely amend clinical notes.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="glass-card p-8 hover:-translate-y-2 transition-all duration-300 animate-fade-in-up animation-delay-300 group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Smart Scheduling</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Seamless appointment booking with real-time status updates and cancellation management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
