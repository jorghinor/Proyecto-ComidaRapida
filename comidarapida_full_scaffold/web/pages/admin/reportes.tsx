import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Header from '../../components/Header';
import useSWR from 'swr';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PopularityPieChart from '../../components/charts/PopularityPieChart';
import CategoryBarChart from '../../components/charts/CategoryBarChart';
import PopularAdsTable from '../../components/tables/PopularAdsTable'; // Importar tabla
import AdsByCategoryTable from '../../components/tables/AdsByCategoryTable'; // Importar tabla

// Definir la URL de la API del backend
const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Tipos de datos para los reportes
interface PopularAd {
  title: string;
  likes: number;
}

interface AdsByCategory {
  categoryName: string;
  count: number;
}

// Fetcher para SWR que incluye el token de autorización
const fetcher = (url: string, token: string) => 
  axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

export default function ReportesPage({ token }: { token: string }) {
  // Cargar datos para los reportes usando SWR
  const { data: popularAds, error: popularAdsError } = useSWR<PopularAd[]>(
    token ? `${backendApiUrl}/admin/reports/popular-ads` : null,
    (url) => fetcher(url, token)
  );

  const { data: adsByCategory, error: adsByCategoryError } = useSWR<AdsByCategory[]>(
    token ? `${backendApiUrl}/admin/reports/ads-by-category` : null,
    (url) => fetcher(url, token)
  );

  const handleDownloadPdf = async (elementId: string, fileName: string) => {
    const reportElement = document.getElementById(elementId);
    if (!reportElement) {
      console.error('Error: No se encontró el elemento del reporte.');
      return;
    }

    try {
      const canvas = await html2canvas(reportElement, { scale: 2 }); // Aumentar escala para mejor calidad
      const imgData = canvas.toDataURL('image/png');
      
      // Crear PDF en formato A4 (orientación vertical)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      
      let newWidth = pdfWidth - 20; // Ancho con márgenes de 10mm a cada lado
      let newHeight = newWidth / ratio;

      // Si la altura es mayor que la del PDF, ajustar
      if (newHeight > pdfHeight - 20) {
        newHeight = pdfHeight - 20;
        newWidth = newHeight * ratio;
      }

      const x = (pdfWidth - newWidth) / 2; // Centrar horizontalmente
      const y = 10; // Margen superior de 10mm

      pdf.addImage(imgData, 'PNG', x, y, newWidth, newHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Hubo un error al generar el PDF.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - Reportes (Admin)</title>
      </Head>
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Reportes de Anuncios</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sección de Anuncios Populares */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div id="reporte-popularidad">
              <h2 className="text-xl font-semibold mb-4 text-center">Anuncios más Populares</h2>
              <div className="max-w-sm mx-auto"> {/* Contenedor para limitar tamaño del gráfico */}
                {popularAdsError && <p className="text-red-500">Error al cargar los datos.</p>}
                {!popularAds && !popularAdsError && <p>Cargando gráfico...</p>}
                {popularAds && popularAds.length > 0 && <PopularityPieChart data={popularAds} />}
              </div>
              {popularAds && popularAds.length > 0 && <PopularAdsTable data={popularAds} />}
              {popularAds && popularAds.length === 0 && <p className="text-center">No hay datos de popularidad para mostrar.</p>}
            </div>
            <button 
              onClick={() => handleDownloadPdf('reporte-popularidad', 'reporte-popularidad-anuncios')}
              disabled={!popularAds || popularAds.length === 0}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              Descargar Reporte PDF
            </button>
          </div>

          {/* Sección de Anuncios por Categoría */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div id="reporte-categorias">
              <h2 className="text-xl font-semibold mb-4 text-center">Anuncios por Categoría</h2>
              <div className="max-w-md mx-auto"> {/* Contenedor para limitar tamaño del gráfico */}
                {adsByCategoryError && <p className="text-red-500">Error al cargar los datos.</p>}
                {!adsByCategory && !adsByCategoryError && <p>Cargando gráfico...</p>}
                {adsByCategory && adsByCategory.length > 0 && <CategoryBarChart data={adsByCategory} />}
              </div>
              {adsByCategory && adsByCategory.length > 0 && <AdsByCategoryTable data={adsByCategory} />}
              {adsByCategory && adsByCategory.length === 0 && <p className="text-center">No hay datos de categorías para mostrar.</p>}
            </div>
            <button 
              onClick={() => handleDownloadPdf('reporte-categorias', 'reporte-anuncios-por-categoria')}
              disabled={!adsByCategory || adsByCategory.length === 0}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              Descargar Reporte PDF
            </button>
          </div>
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
