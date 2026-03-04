import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface PopularAd {
  title: string;
  likes: number;
}

interface PopularityPieChartProps {
  data: PopularAd[];
}

const PopularityPieChart = ({ data: popularAds }: PopularityPieChartProps) => {
  const chartData: ChartData<'pie'> = {
    labels: popularAds.map(ad => ad.title),
    datasets: [
      {
        label: '# de "Me Gusta"',
        data: popularAds.map(ad => ad.likes),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)',
          'rgba(83, 102, 255, 0.7)',
          'rgba(40, 159, 64, 0.7)',
          'rgba(210, 99, 132, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(40, 159, 64, 1)',
          'rgba(210, 99, 132, 1)',
        ],
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
        text: 'Top 10 Anuncios por "Me Gusta"',
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default PopularityPieChart;
