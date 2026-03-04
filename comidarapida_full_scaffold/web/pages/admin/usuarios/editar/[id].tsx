import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import useSWR from 'swr';
import Header from '../../../../components/Header';

const fetcher = (url: string, token: string) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

export default function AdminEditarUsuarioPage({ token }: { token: string }) {
  const router = useRouter();
  const { id } = router.query;

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Corregido: Apuntar a la ruta del proxy correcta
  const { data: userData, error: userError } = useSWR(
    id && token ? [`/api/proxy/admin/users/${id}`, token] : null,
    ([url, token]) => fetcher(url, token)
  );

  useEffect(() => {
    if (userData) {
      setEmail(userData.email);
      setFullName(userData.fullName || '');
      setRole(userData.role);
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData: any = { email, fullName, role };
      if (password) {
        updateData.password = password;
      }

      // Corregido: Apuntar a la ruta del proxy correcta
      await axios.put(`/api/proxy/admin/users/${id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Usuario actualizado con éxito.');
      router.push('/admin/usuarios');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ocurrió un error al actualizar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - Editar Usuario</title>
      </Head>
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Editar Usuario</h1>
          
          {userError && <div>Error al cargar el usuario. Por favor, intente de nuevo.</div>}
          {!userData && id && <div>Cargando usuario...</div>}

          {userData && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña (dejar vacío para no cambiar)</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rol</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="client">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
                {loading ? 'Actualizando...' : 'Actualizar Usuario'}
              </button>
              {error && <p className="text-red-500 text-center">{error}</p>}
            </form>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-4 px-6 text-center">
        <p>&copy; {new Date().getFullYear()} ComidaRapida. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  if (!session || session.user.role !== 'admin') {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  return {
    props: {
      session,
      token: session.accessToken,
    },
  };
};
