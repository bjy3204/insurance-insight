/** Run once in the Apps Script project attached to the report template. */
function finishHexagonChart() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const cover = book.getSheets().find(s => s.getSheetId() === 1325894710);
  if (!cover) throw new Error('표지 시트를 찾지 못했습니다.');
  const data = book.getSheets().find(s => s.getSheetId() === 903618020);
  if (!data) throw new Error('육각형 차트 데이터를 찾지 못했습니다.');
  const axis = {
    textPosition: 'none',
    baselineColor: 'transparent',
    gridlines: {color: 'transparent'},
    minorGridlines: {color: 'transparent'},
    viewWindow: {min: -1.4, max: 1.4},
    viewWindowMode: 'explicit'
  };
  cover.insertChart(cover.newChart()
    .addRange(data.getRange('A1:C46'))
    .setChartType(Charts.ChartType.SCATTER)
    .setNumHeaders(0)
    .setPosition(12, 7, 0, 0)
    .setOption('width', 300)
    .setOption('height', 220)
    .setOption('hAxis', axis)
    .setOption('vAxis', axis)
    .setOption('legend', {position: 'none'})
    .setOption('backgroundColor', {fill: 'transparent', stroke: 'transparent'})
    .setOption('chartArea', {left: 15, top: 30, width: 270, height: 175})
    .setOption('title', '후유장해 · 암 · 심장 · 뇌 · 수술 · 입원')
    .setOption('titleTextStyle', {fontSize: 9, color: '#333333'})
    .setOption('series', {
      0: {color: '#cccccc', lineWidth: 1, pointSize: 0},
      1: {color: '#ff8c19', lineWidth: 2, pointSize: 2}
    })
    .build());
  SpreadsheetApp.flush();
}
