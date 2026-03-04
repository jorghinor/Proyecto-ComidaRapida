import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import Script from 'next/script'
import { SWRConfig } from 'swr' // Importar SWRConfig

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      {/* Envolver la aplicación con SWRConfig */}
      <SWRConfig 
        value={{
          revalidateOnFocus: false, // Opcional: para no revalidar al enfocar la ventana
          revalidateIfStale: false, // Opcional: para no revalidar si los datos no han cambiado
          // Puedes añadir otras configuraciones globales de SWR aquí
        }}
      >
        <Script src="https://js.stripe.com/v3/" strategy="lazyOnload" />
        <Component {...pageProps} />
      </SWRConfig>
    </SessionProvider>
  )
}
