import { useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

type Provider = {
  id: string;
  name: string;
};

type SignInProps = {
  providers: Record<string, Provider>;
};

export default function SignIn({ providers }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      redirect: false, // No redirigir automáticamente
      email,
      password,
    });

    if (result?.ok) {
      // Si el inicio de sesión es exitoso, redirigir a la página principal
      router.push('/');
    } else {
      // Si hay un error, mostrarlo
      setError(result?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '350px', border: '1px solid #ccc', padding: '2rem', borderRadius: '8px' }}>
        <h1>Iniciar Sesión</h1>

        {/* Formulario de Credenciales */}
        <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '10px' }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '10px' }}
          />
          <button type="submit" style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px' }}>
            Iniciar Sesión
          </button>
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        </form>

        <div style={{ textAlign: 'center', margin: '1rem 0' }}>O</div>

        {/* Botones de Proveedores Externos (Google, Facebook) */}
        {Object.values(providers).map((provider) => {
          if (provider.id === 'credentials') return null;
          return (
            <div key={provider.name}>
              <button
                onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                style={{ width: '100%', padding: '10px', cursor: 'pointer', marginBottom: '0.5rem' }}
              >
                Continuar con {provider.name}
              </button>
            </div>
          );
        })}

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p>¿No tienes una cuenta? <Link href="/auth/register" style={{ color: '#0070f3' }}>Regístrate</Link></p>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const providers = await getProviders();
  return {
    props: { providers: providers ?? {} }, // Asegurarse de que providers no sea null
  };
};
