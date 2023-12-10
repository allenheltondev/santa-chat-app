import { useEffect, useState } from 'react';
import { Flex, Card } from '@aws-amplify/ui-react';
import { Chart as ChartJS, CategoryScale, ArcElement, LinearScale, BarElement, Title, Tooltip, Legend, Colors } from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Colors, Title, Tooltip, Legend);

const Charts = ({ data, contentCountGoal }) => {
  const [pieData, setPieData] = useState({});
  const [barData, setBarData] = useState({});
  const [scheduledChartData, setScheduledChartData] = useState({ labels: [], datasets: [] });
  const [completedChartData, setCompletedChartData] = useState({ labels: [], datasets: [] });
  const [hasChartData, setHasChartData] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }

    const typeCounts = {};
    const serviceCounts = {};

    const chartData = data.filter(d => !['Submitted', 'Rejected'].includes(d.status));
    chartData.forEach(item => {
      item.type.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      item.services.forEach(service => {
        serviceCounts[service] = (serviceCounts[service] || 0) + 1;
      });
    });

    setPieData({
      labels: Object.keys(typeCounts),
      datasets: [
        {
          data: Object.values(typeCounts)
        },
      ],
    });

    setBarData({
      labels: Object.keys(serviceCounts),
      datasets: [
        {
          label: 'Content Count',
          data: Object.values(serviceCounts),
          borderWidth: 1,
        },
      ],
    });

    setHasChartData(chartData.length > 0);

    if (contentCountGoal) {
      const scheduled = chartData.filter(cd => cd.status == 'Scheduled').length;
      const completed = chartData.filter(cd => cd.status == 'Completed').length;
      const percentComplete = ((completed / contentCountGoal) * 100);
      const completedData = {
        labels: ['% Complete'],
        datasets: [
          {
            label: `Percent of goal (${contentCountGoal})`,
            data: [percentComplete, 100 - percentComplete],
            borderWidth: 1,
          },
        ]
      };
      setCompletedChartData(completedData);

      const percentScheduled = Math.round(((completed + scheduled) / contentCountGoal) * 100);
      const scheduledData = {
        labels: ['% Scheduled'],
        datasets: [
          {
            label: `Percent of goal (${contentCountGoal})`,
            data: [percentScheduled, 100 - percentScheduled],
            borderWidth: 1,
          },
        ]
      };
      setScheduledChartData(scheduledData);
    }
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      colors: {
        enabled: true,
        forceOverride: true
      }
    }
  };

  const optionsWithScales = {
    ...options,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        }
      }
    }
  };

  return (
    <Card variation='elevated'>
      <Flex direction="row" height="25em" alignItems="center" justifyContent="center">
        {hasChartData && (
          <>
            <Pie data={pieData} options={options} />
            <Bar data={barData} options={optionsWithScales} />
            {contentCountGoal > 0 && (<Flex direction="column" gap="1em">
              <Flex height="12em">
                <Doughnut data={scheduledChartData} options={options} />
              </Flex>
              <Flex height="12em">
                <Doughnut data={completedChartData} options={options} />
              </Flex>
            </Flex>
            )}
          </>)}
      </Flex>
    </Card>
  );
};

export default Charts;
