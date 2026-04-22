export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: '2rem' }}>
        {children}
      </body>
    </html>
  );
}
