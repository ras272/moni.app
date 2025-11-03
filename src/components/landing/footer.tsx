import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className='bg-white py-12'>
      <div className='mx-auto max-w-7xl px-6 text-center'>
        {/* Logo */}
        <div className='mb-6 flex justify-center'>
          <div className='flex items-center gap-2'>
            <Image
              src='/Shaka.png'
              alt='Moni Logo'
              width={48}
              height={48}
              className='h-12 w-12'
            />
            <span className='text-2xl font-bold text-zinc-950'>Moni</span>
          </div>
        </div>

        {/* Copyright */}
        <p className='mb-6 text-sm text-zinc-600'>
          © {new Date().getFullYear()} Moni | Created with 💚 from Paraguay
        </p>

        {/* Social Icons */}
        {/* <div className='mb-6 flex justify-center gap-4'>
          <a
            href='https://instagram.com/moni'
            target='_blank'
            rel='noopener noreferrer'
            className='text-zinc-600 transition-colors hover:text-[#1F7D67]'
            aria-label='Instagram'
          >
            <Instagram className='h-5 w-5' />
          </a>
          <a
            href='https://twitter.com/moni'
            target='_blank'
            rel='noopener noreferrer'
            className='text-zinc-600 transition-colors hover:text-[#1F7D67]'
            aria-label='Twitter'
          >
            <Twitter className='h-5 w-5' />
          </a>
          <a
            href='https://linkedin.com/company/moni'
            target='_blank'
            rel='noopener noreferrer'
            className='text-zinc-600 transition-colors hover:text-[#1F7D67]'
            aria-label='LinkedIn'
          >
            <Linkedin className='h-5 w-5' />
          </a>
        </div> */}

        {/* Terms Link */}
        <div>
          <Link
            href='/legal/terms-of-service'
            className='text-sm text-zinc-600 transition-colors hover:text-[#1F7D67]'
          >
            Terms of use
          </Link>
        </div>
      </div>
    </footer>
  );
}
