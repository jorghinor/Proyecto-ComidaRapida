interface PopularAd {
  title: string;
  likes: number;
}

interface PopularAdsTableProps {
  data: PopularAd[];
}

const PopularAdsTable = ({ data }: PopularAdsTableProps) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Datos del Reporte</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                Título del Anuncio
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                Nº de "Me Gusta"
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((ad, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b text-sm text-gray-800">{ad.title}</td>
                <td className="px-4 py-2 border-b text-sm text-gray-800">{ad.likes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PopularAdsTable;
