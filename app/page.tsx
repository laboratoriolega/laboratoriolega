export default async function DashboardPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Dashboard Diagnostic</h1>
      <p>If you see this, the App Router is working correctly.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
