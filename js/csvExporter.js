/**
 * 選択月のデータをCSVとして出力・ダウンロードする関数
 * @param {Object} settings - habit_settings データ
 * @param {Object} logs - habit_logs データ
 * @param {Object} memos - habit_memos データ
 */
export function exportMonthToCSV(settings, logs, memos) {
  const year = settings.year;
  const month = settings.month;
  const monthStr = String(month).padStart(2, '0');
  const daysInMonth = new Date(year, month, 0).getDate();

  // --------------------------------------------------
  // 1. 全習慣アイテムをフラットな配列として抽出
  // --------------------------------------------------
  const allItems = [];
  settings.categories.forEach(cat => {
    cat.items.forEach(item => {
      allItems.push({
        id: item.id,
        catName: cat.name,
        itemName: item.name
      });
    });
  });

  // ステータス記号変換ヘルパー
  const formatStatus = (logEntry) => {
    if (!logEntry) return '-';
    let status = 'none';
    let memo = '';

    if (typeof logEntry === 'object' && logEntry !== null) {
      status = logEntry.status || 'none';
      memo = typeof logEntry.memo === 'string' ? logEntry.memo.trim() : '';
    } else if (typeof logEntry === 'string') {
      status = logEntry;
    } else if (typeof logEntry === 'boolean') {
      status = logEntry ? 'done' : 'failed';
    }

    let symbol = '-';
    if (status === 'done' || status === true) symbol = '〇';
    else if (status === 'in_progress' || status === 'triangle') symbol = '△';
    else if (status === 'failed' || status === false) symbol = '×';

    return memo ? `${symbol} (${memo})` : symbol;
  };

  // CSVエスケープ処理（カンマや改行・ダブルクォーテーション対策）
  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const stringVal = String(str);
    return `"${stringVal.replace(/"/g, '""')}"`;
  };

  const csvRows = [];

  // --------------------------------------------------
  // 2. ヘッダーエリア（アプリ情報 & メモサマリー）
  // --------------------------------------------------
  csvRows.push([escapeCSV(`Habit Harbor - ${year}年${month}月 習慣記録データ`)]);
  csvRows.push([escapeCSV(`[全体メモ]`), escapeCSV(memos['global'] || '')]);
  csvRows.push([escapeCSV(`[${year}年のメモ]`), escapeCSV(memos[`year-${year}`] || '')]);
  csvRows.push([escapeCSV(`[${year}年${month}月のメモ]`), escapeCSV(memos[`month-${year}-${month}`] || '')]);
  csvRows.push([]); // 空白行

  // --------------------------------------------------
  // 3. テーブルヘッダー（列タイトル）
  // --------------------------------------------------
  const tableHeader = ['日付'];
  allItems.forEach(item => {
    tableHeader.push(`${item.catName} : ${item.itemName}`);
  });
  tableHeader.push('日別メモ');
  csvRows.push(tableHeader.map(escapeCSV));

  // --------------------------------------------------
  // 4. データ行（1日〜月末）
  // --------------------------------------------------
  for (let d = 1; d <= daysInMonth; d++) {
    // const monthStr = String(month).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    const row = [dateKey];

    // 各アイテムのステータス取得
    allItems.forEach(item => {
      const logEntry = logs?.[dateKey]?.[item.id];
      row.push(formatStatus(logEntry));
    });

    // 日別メモの取得
    const dayMemo = memos[`day-${dateKey}`] || '';
    row.push(dayMemo);

    csvRows.push(row.map(escapeCSV));
  }

  // --------------------------------------------------
  // 5. CSVファイル生成 & ダウンロード処理
  // --------------------------------------------------
  const csvString = csvRows.map(e => e.join(',')).join('\n');
  
  // Excelでの文字化けを防止する BOM (\uFEFF) を付与
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `HabitHarbor_${year}_${monthStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}