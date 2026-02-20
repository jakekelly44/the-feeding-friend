export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-light-cream">
      {children}
      {/* No bottom navigation on auth pages */}
    </div>
  );
}
