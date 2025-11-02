'use client';

import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Navbar1 = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { name: 'Inicio', href: '/' },
    { name: 'Características', href: '#features' },
    { name: 'Precios', href: '#pricing' },
    { name: 'Contacto', href: '#contact' }
  ];

  return (
    <div className='flex w-full justify-center px-4 py-6'>
      <div className='relative z-10 flex w-full max-w-3xl items-center justify-between rounded-full bg-white px-6 py-3 shadow-lg'>
        <div className='flex items-center'>
          <motion.div
            className='mr-4 h-12 w-12'
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={{ rotate: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src='/Shaka.png'
              alt='Moni Logo'
              width={48}
              height={48}
              className='h-12 w-12 object-contain'
            />
          </motion.div>
        </div>

        {/* Desktop Navigation */}
        <nav className='hidden items-center space-x-8 md:flex'>
          {navItems.map((item) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <a
                href={item.href}
                className='text-sm font-medium text-gray-900 transition-colors hover:text-gray-600'
              >
                {item.name}
              </a>
            </motion.div>
          ))}
        </nav>

        {/* Desktop CTA Button */}
        <motion.div
          className='hidden md:block'
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
        >
          <Link
            href='/auth/sign-up'
            className='inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm text-white transition-colors hover:bg-gray-800'
          >
            Comenzar
          </Link>
        </motion.div>

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
              {navItems.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <a
                    href={item.href}
                    className='text-base font-medium text-gray-900'
                    onClick={toggleMenu}
                  >
                    {item.name}
                  </a>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className='pt-6'
              >
                <Link
                  href='/auth/sign-up'
                  className='inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-base text-white transition-colors hover:bg-gray-800'
                  onClick={toggleMenu}
                >
                  Comenzar
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { Navbar1 };
