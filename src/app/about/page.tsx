'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const DOG_PHOTOS = [
  '/dogs/1.webp',
  '/dogs/2.webp',
  '/dogs/3.webp',
  '/dogs/4.webp',
  '/dogs/5.webp',
  '/dogs/6.webp',
  '/dogs/7.webp',
  '/dogs/8.webp',
  '/dogs/9.webp',
  '/dogs/10.webp',
  '/dogs/11.webp',
  '/dogs/12.webp',
  '/dogs/13.webp',
];

export default function AboutPage() {
  const router = useRouter();
  const [currentPhoto, setCurrentPhoto] = useState(0);

  const nextPhoto = () => {
    setCurrentPhoto((prev) => (prev + 1) % DOG_PHOTOS.length);
  };

  const prevPhoto = () => {
    setCurrentPhoto((prev) => (prev - 1 + DOG_PHOTOS.length) % DOG_PHOTOS.length);
  };

  return (
    <div className="min-h-screen bg-light-cream">
      {/* Header */}
      <div className="sticky top-0 bg-light-cream z-10 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-500" />
          </button>
          <h1 className="text-xl font-bold text-charcoal">About Feeding Friend</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8 max-w-2xl mx-auto">
        {/* Founder Story */}
        <div className="prose prose-lg">
          <h2 className="text-2xl font-bold text-charcoal mb-4">About the Founder</h2>
          
          <p className="text-gray-700 mb-4">
            Hi — I'm Jake Kelly, a lifelong pet owner, product builder, and the person behind Feeding Friend.
          </p>

          <p className="text-gray-700 mb-4">
            My wife and I share our home with a small zoo — dogs named Zooey, Kado, Vega, Diabla, Mako, Brodie, and Gracie, plus our cats Bear, Pixie, Hera, Hades, and IO. Like most people who love animals, we've spent years trying to give them the longest, healthiest lives possible. And along that journey, one thing became painfully clear:
          </p>

          <p className="text-gray-700 mb-4 font-semibold">
            Weight management is one of the most powerful — and most overlooked — factors in pet health.
          </p>

          <p className="text-gray-700 mb-4">
            I watched arthritis worsen as my larger dogs aged. I saw injuries, surgeries, and recovery periods where careful feeding made all the difference. When Kado needed surgery and Zooey required diligent weight control, I realized something didn't make sense: as humans, we use data, calories, and structured plans to manage our own health — yet pet food bags still rely on generalized feeding charts that ignore lifestyle, activity level, breed, or medical history.
          </p>

          <p className="text-gray-700 mb-4">
            That frustration — and a deep love for my animals — is what led me to build Feeding Friend.
          </p>

          <p className="text-gray-700 mb-4">
            By day, I work as a product owner building healthcare software, where decisions are driven by data, thoughtful design, and real-world outcomes. Feeding Friend applies that same mindset to pet nutrition: a science-backed, decision-support tool that helps owners understand their pet's metabolic needs and turn that insight into practical feeding plans.
          </p>

          <p className="text-gray-700 mb-4">
            This project didn't start as a business idea. It started as late-night conversations at home, a desire to do better for our animals, and the belief that pet owners deserve tools that are transparent, rational, and grounded in real science — not marketing hype.
          </p>

          <div className="bg-soft-peach-50 border-l-4 border-soft-peach p-4 my-6">
            <p className="text-gray-700 font-medium mb-2">Feeding Friend is meant to be:</p>
            <ul className="space-y-2 text-gray-700">
              <li>• A practical guide for everyday feeding decisions</li>
              <li>• A clinical-style calculator that adapts to real life</li>
              <li>• A thoughtful second opinion — not a replacement for your veterinarian</li>
            </ul>
          </div>

          <p className="text-gray-700 mb-4">
            If you're here, you probably care deeply about your pets too. My hope is that this tool helps you feel more confident, more informed, and more in control of how you care for them.
          </p>

          <p className="text-gray-700 mb-6">
            Thanks for being here — and for loving your animals enough to do things differently.
          </p>

          <p className="text-gray-700 font-medium">
            — Jake Kelly<br />
            Founder, Feeding Friend
          </p>
        </div>

        {/* Dog Photo Carousel */}
        <div className="mt-12 bg-white rounded-card shadow-card p-6">
          <h3 className="text-lg font-semibold text-charcoal mb-4 text-center">Meet the Pack</h3>
          
          <div className="relative">
            {/* Main Photo */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
              <img
                src={DOG_PHOTOS[currentPhoto]}
                alt={`Dog photo ${currentPhoto + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>

            {/* Photo Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {currentPhoto + 1} / {DOG_PHOTOS.length}
            </div>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {DOG_PHOTOS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPhoto(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentPhoto
                    ? 'bg-deep-teal w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
