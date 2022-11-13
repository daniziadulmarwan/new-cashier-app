// DAILY CHART
let dailyChartData = {
  labels: [],
  datasets: [
    {
      label: "Penjualan",
      backgroundColor: ["coral"],
      borderColor: ["coral"],
      data: [],
    },
    {
      label: "Profit",
      backgroundColor: ["red"],
      borderColor: ["red"],
      data: [],
    },
  ],
};

const dailyConfig = {
  type: "line",
  data: dailyChartData,
  options: {
    scales: {
      y: { beginAtZero: true },
    },
  },
};

const dailyCtx = document.getElementById("daily-sales").getContext("2d");
const dailyChart = new Chart(dailyCtx, dailyConfig);

const dailySalesChart = (month, year) => {
  let dailyQuery = `select sales_table.*, sum(discount_final.total_discount_final) as discount_final from (select date(input_date) as date, sum(total) as total, sum((qty*cost_of_product)) as cogs from sales where substr(date(input_date), 1, 7) = '${year}-${month}' group by date) as sales_table left join discount_final on sales_table.date = date(discount_final.input_date) group by date`;

  db.all(dailyQuery, (err, rows) => {
    if (err) throw err;
    let dateArray = [];
    let salesArray = [];
    let profitArray = [];
    rows.map((row) => {
      let netSales = row.total - row.discount_final;
      let profit = netSales - row.cogs;
      dateArray.push(row.date);
      salesArray.push(netSales);
      profitArray.push(profit);
    });

    dailyChartData.labels = dateArray;
    dailyChartData.datasets[0].data = salesArray;
    dailyChartData.datasets[1].data = profitArray;
    dailyChart.update();
  });
};
