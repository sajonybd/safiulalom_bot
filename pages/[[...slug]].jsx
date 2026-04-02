import dynamic from 'next/dynamic';
import Head from 'next/head';

// We dynamically import the App component from the Vite source structure
// Setting ssr: false ensures that BrowserRouter and other client-side APIs
// do not throw Server Side Rendering hydration errors in Next.js.
const App = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center font-sans">Loading workspace...</div>
});

export default function SpaRoute() {
  return (
    <>
      <Head>
        <title>Safiul Alom - Flow Nest</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <App />
    </>
  );
}
