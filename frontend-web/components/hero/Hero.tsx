'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Smartphone, Map, Clock, Shield } from 'lucide-react';
import Image from 'next/image';

interface HeroProps {
  onBookNow: () => void;
}

export const Hero = ({ onBookNow }: HeroProps) => {
  return (
    <section className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Your Journey,
              <br />
              <span className="text-yellow-200">Our Priority</span>
            </h1>
            <p className="text-lg text-white/90 mb-8 max-w-lg">
              Book moto taxis and track buses in real-time across Rwanda. 
              Safe, affordable, and reliable transportation at your fingertips.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button 
                onClick={onBookNow}
                className="bg-white text-yellow-500 px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                Book a Ride <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all">
                Download App
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm text-white/80">Happy Riders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm text-white/80">Active Drivers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">4.9</div>
                <div className="text-sm text-white/80">Rating</div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - App Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative mx-auto max-w-sm">
              <div className="bg-black rounded-3xl p-2 shadow-2xl">
                <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-yellow-500">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold">MotoBus</div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                        <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                        <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Pickup Location</div>
                      <div className="text-white text-sm">Kigali City Tower</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xs text-gray-400">Destination</div>
                      <div className="text-white text-sm">Kigali Heights</div>
                    </div>
                    <div className="bg-yellow-500 rounded-lg p-3 text-center">
                      <div className="text-white font-semibold">Find a Ride</div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Map className="w-3 h-3" /> 2.5 km
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 10 min
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Safe
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-10 -right-10 bg-white rounded-full p-3 shadow-lg"
              >
                <Smartphone className="w-6 h-6 text-yellow-500" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="absolute -bottom-10 -left-10 bg-white rounded-full p-3 shadow-lg"
              >
                <Map className="w-6 h-6 text-yellow-500" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
          <path fill="#f9fafb" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,181.3C672,181,768,203,864,208C960,213,1056,203,1152,186.7C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
};