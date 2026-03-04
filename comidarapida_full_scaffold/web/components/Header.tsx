import Link from 'next/link';
import Image from 'next/image'; // Importar el componente Image
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-gradient-to-r from-lime-300 to-green-400 shadow-md py-4 px-6 flex justify-between items-center">
      <Link 
        href="/" 
        className="flex items-center animate-move-left-right" // Contenedor flex para alinear imagen y texto
      >
        <Image 
          src="/icons/comidarapida.png" 
          alt="ComidaRapida Logo"
          width={50} // Ancho de la imagen
          height={50} // Alto de la imagen
          className="mr-2" // Margen a la derecha para separar del texto
        />
        <span 
          className="text-2xl font-bold text-red-600"
          style={{ textShadow: '2px 2px 4px yellow' }} // Sombreado amarillo
        >
          ComidaRapida
        </span>
      </Link>
      <nav className="flex items-center space-x-4">
        <Link href="/mapa" className="text-gray-800 hover:text-black font-semibold">
          Mapa
        </Link>
        {session ? (
          <>
            <span className="text-gray-800 font-semibold">Hola, {session.user?.email}</span>
            {session.user?.role === 'admin' && (
              <>
                <Link href="/admin/dashboard" className="text-gray-800 hover:text-black font-semibold">
                  Admin
                </Link>
                <Link href="/admin/reportes" className="text-gray-800 hover:text-black font-semibold">
                  Reportes
                </Link>
              </>
            )}
            <Link href="/mis-anuncios" className="text-gray-800 hover:text-black font-semibold">
              Mis Anuncios
            </Link>
            <Link href="/anuncios/crear" className="text-gray-800 hover:text-black font-semibold">
              Crear Anuncio
            </Link>
            <button onClick={() => signOut()} className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md">
              Cerrar Sesión
            </button>
          </>
        ) : (
          <Link href="/auth/signin" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md">
            Iniciar Sesión
          </Link>
        )}
      </nav>
    </header>
  );
}
