'use client';

import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className='relative z-50 flex w-full justify-center overflow-x-hidden px-4 py-6'>
      <div className='flex w-full max-w-3xl items-center justify-between rounded-full border border-gray-200 bg-white px-6 py-3 shadow-lg'>
        <div className='flex items-center'>
          <motion.div
            className='mr-6 h-8 w-8'
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ rotate: 10 }}
            transition={{ duration: 0.3 }}
          >
            <svg
              width='32'
              height='32'
              viewBox='0 0 32 32'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <circle cx='16' cy='16' r='16' fill='url(#paint0_linear)' />
              <defs>
                <linearGradient
                  id='paint0_linear'
                  x1='0'
                  y1='0'
                  x2='32'
                  y2='32'
                  gradientUnits='userSpaceOnUse'
                >
                  <stop stopColor='#FF9966' />
                  <stop offset='1' stopColor='#FF5E62' />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </div>

        {/* Desktop Navigation */}
        <nav className='hidden items-center space-x-8 md:flex'>
          {['Home', 'Pricing', 'Docs', 'Projects'].map((item) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <a
                href='#'
                className='text-sm font-medium text-gray-900 transition-colors hover:text-gray-600'
              >
                {item}
              </a>
            </motion.div>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className='hidden items-center gap-3 md:flex'>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <a
              href='#'
              className='inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm text-white transition-colors hover:bg-gray-800'
            >
              Get Started
            </a>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          className='flex items-center md:hidden'
          onClick={toggleMenu}
          whileTap={{ scale: 0.9 }}
        >
          <Menu className='h-6 w-6 text-gray-900' />
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className='fixed inset-0 z-50 bg-white px-6 pt-24 md:hidden'
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <motion.button
              className='absolute top-6 right-6 p-2'
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className='h-6 w-6 text-gray-900' />
            </motion.button>
            <div className='flex flex-col space-y-6'>
              {['Home', 'Pricing', 'Docs', 'Projects'].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <a
                    href='#'
                    className='text-base font-medium text-gray-900'
                    onClick={toggleMenu}
                  >
                    {item}
                  </a>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className='pt-2'
              >
                <a
                  href='#'
                  className='inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-base text-white transition-colors hover:bg-gray-800'
                  onClick={toggleMenu}
                >
                  Get Started
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { Navbar };
