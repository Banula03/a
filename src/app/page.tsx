export default function Home() {
  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>Banking Report API</h1>
      <p>Backend-only service. Single endpoint:</p>
      <hr />
      <pre>{`
POST /api/auth
  Auth:  Basic Auth (username:password base64 encoded)
  Body:  { "reportID": "..." }
  Returns: { success, token, reportID, message }
      `}</pre>
    </div>
  );
}
