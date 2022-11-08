const yearSelect = () => {
  let yearOptions = "";
  db.all(
    `select name from sqlite_master where type='table' and name not like 'sqlite_%'`,
    (err, rows) => {
      if (err) throw err;
      if (rows.length < 1) {
        db.all(
          `select substr(date(input_date), 1,4 ) as sales_year from sales limit 1`,
          (err, row) => {
            if (err) throw err;
            let year;
            if (row.length < 1) {
              let d = new Date();
              year = parseInt(d.getFullYear());
            } else {
              year = parseInt(row[0].sales_year);
            }

            let i;
            for (let i = 0; i < 21; i++) {
              yearOptions += `<option value="${year + i}">${year + i}</option>`;
            }
          }
        );
      } else {
        let d = new Date();
        let year = parseInt(d.getFullYear());
        let i;
        for (let i = 0; i < 21; i++) {
          yearOptions += `<option value="${year + i}">${year + i}</option>`;
        }
      }
    }
  );
  $("#start-year").html(yearOptions);
};
