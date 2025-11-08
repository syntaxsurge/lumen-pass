function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#020617',
      color: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
        {statusCode ? `${statusCode} error` : 'Application error'}
      </h1>
      <p style={{ maxWidth: 420, textAlign: 'center', lineHeight: 1.5 }}>
        Something unexpected happened while rendering this page. Reload or head back to the
        homepage.
      </p>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default ErrorPage
