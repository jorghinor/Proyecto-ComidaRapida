interface AdsByCategory {
  categoryName: string;
  count: number;
}

interface AdsByCategoryTableProps {
  data: AdsByCategory[];
}

const AdsByCategoryTable = ({ data }: AdsByCategoryTableProps) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Datos del Reporte</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                Categoría
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                Número de Anuncios
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b text-sm text-gray-800">{item.categoryName}</td>
                <td className="px-4 py-2 border-b text-sm text-gray-800">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdsByCategoryTable;
