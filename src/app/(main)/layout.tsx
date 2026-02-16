import Link from 'next/link';
import { Home, Search, Utensils, BarChart3, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/foods', icon: Search, label: 'Foods' },
  { href: '/meals', icon: Utensils, label: 'Meals' },
  { href: '/costs', icon: BarChart3, label: 'Costs' },
  { href: '/account', icon: User, label: 'Account' },
];

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen pb-20">
      {children}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-50">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-deep-teal transition-colors"
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
