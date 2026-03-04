import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AdsByCategory {
  categoryName: string;
  count: number;
}

interface CategoryBarChartProps {
  data: AdsByCategory[];
}

const CategoryBarChart = ({ data: adsByCategory }: CategoryBarChartProps) => {
  const chartData: ChartData<'bar'> = {
    labels: adsByCategory.map(item => item.categoryName),
    datasets: [
      {
        label: 'Número de Anuncios',
        data: adsByCategory.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Número de Anuncios por Categoría',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1, // Mostrar solo números enteros en el eje Y
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default CategoryBarChart;
