import { StockPrice, TimeRange } from "../_models/types";

export const limitChartData = (stockPrices: StockPrice[]) => {
  const maxPoints = 250; // 250 for each timestep
  if (stockPrices.length <= maxPoints) return stockPrices;
  const step = Math.floor(stockPrices.length / maxPoints);
  return stockPrices.filter((_, index) => index % step === 0);
};


export const getFilteredPrices = (
  stockPrices: StockPrice[],
  timeRange: TimeRange,
) => {
  if (stockPrices.length === 0) return [];
  const now = new Date().getTime();

  let startingTime: Date;
  if (timeRange === "h") {
    startingTime = new Date(now - 60 * 60 * 1000); // 1 hour ago
  } else if (timeRange === "d") {
    startingTime = new Date(now - 24 * 60 * 60 * 1000); // 24 hours ago
  } else if (timeRange === "m") {
    startingTime = new Date(now - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  }

  const filteredPrices =
    timeRange === "max"
      ? stockPrices
      : stockPrices.filter((item) => new Date(item.timestamp) >= startingTime);

      return limitChartData(filteredPrices).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

export const formatTime = (timestamp: string, timeRange: TimeRange) => {
  const date = new Date(timestamp);
  let formattedTime = "";

  if (timeRange === "h") {
    formattedTime = `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
  } else if (timeRange === "d") {
    formattedTime = `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
  } else if (timeRange === "m" || timeRange === "max") {
    formattedTime = `${date.getMonth() + 1}/${date.getDate()}`;
  }
  return formattedTime;
};

export const getChartData = (
  filteredPrices: StockPrice[],
  timeRange: TimeRange,
) => {
  return {
    labels: filteredPrices.map((item) => formatTime(item.timestamp, timeRange)),
    datasets: [
      {
        data: filteredPrices.map((item) => item.price),
        fill: {
          target: "origin",
          above: "rgba(0, 130, 255, 0.2)",
        },
        borderColor: "rgb(0, 130, 255)",
        pointRadius: 0,
        borderWidth: 2,
        hitRadius: 5,
      },
    ],
  };
};

export const calculatePriceChange = (filteredPrices: StockPrice[]) => {
  if (filteredPrices.length < 2) return { change: 0, percentage: 0 };
  const firstPrice = filteredPrices[0].price;
  const lastPrice = filteredPrices[filteredPrices.length - 1].price;
  const change = lastPrice - firstPrice;
  const percentage = ((lastPrice - firstPrice) / firstPrice) * 100;

  return {
    change: change.toFixed(2),
    percentage: percentage.toFixed(2),
  };
};

export const chartOptions = {
  responsive: true,
  animation: { duration: 0 },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `$${context.raw.toFixed(2)}`,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 10,
      },
    },
    y: {
      beginAtZero: true,
    },
  },
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};
