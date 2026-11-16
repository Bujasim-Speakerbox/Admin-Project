export interface SheetTabInfo {
  sheetId: number;
  title: string;
  index: number;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: SheetTabInfo[];
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

async function handleApiResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Google Sheets API error (${res.status})`;
    try {
      const errData = await res.json();
      if (errData?.error?.message) {
        errorMessage = errData.error.message;
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMessage);
  }
  return res.json() as Promise<T>;
}

export async function fetchSpreadsheetMetadata(
  accessToken: string,
  rawIdOrUrl: string
): Promise<SpreadsheetMetadata> {
  const spreadsheetId = extractSpreadsheetId(rawIdOrUrl);
  if (!spreadsheetId) {
    throw new Error('Please enter a valid Google Sheet URL or Spreadsheet ID.');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets.properties(sheetId,title,index)`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await handleApiResponse<{
    spreadsheetId: string;
    properties?: { title?: string };
    spreadsheetUrl?: string;
    sheets?: Array<{
      properties?: { sheetId?: number; title?: string; index?: number };
    }>;
  }>(res);

  const sheets: SheetTabInfo[] = (data.sheets || []).map((s, idx) => ({
    sheetId: s.properties?.sheetId ?? idx,
    title: s.properties?.title || `Tab ${idx + 1}`,
    index: s.properties?.index ?? idx,
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    spreadsheetUrl:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheets,
  };
}

export async function createNewSpreadsheet(
  accessToken: string,
  title: string,
  sheetTitles: string[]
): Promise<SpreadsheetMetadata> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: sheetTitles.map((tabTitle, index) => ({
        properties: {
          title: tabTitle,
          index,
        },
      })),
    }),
  });

  const data = await handleApiResponse<{
    spreadsheetId: string;
    properties?: { title?: string };
    spreadsheetUrl?: string;
    sheets?: Array<{
      properties?: { sheetId?: number; title?: string; index?: number };
    }>;
  }>(res);

  const sheets: SheetTabInfo[] = (data.sheets || []).map((s, idx) => ({
    sheetId: s.properties?.sheetId ?? idx,
    title: s.properties?.title || sheetTitles[idx] || `Tab ${idx + 1}`,
    index: s.properties?.index ?? idx,
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || title,
    spreadsheetUrl:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheets,
  };
}

export async function readSheetValues(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  cellRange = 'A1:Z500'
): Promise<string[][]> {
  const fullRange = `'${sheetTitle.replace(/'/g, "''")}'!${cellRange}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(fullRange)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await handleApiResponse<{ values?: string[][] }>(res);
  return data.values || [];
}

export async function replaceSheetValues(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  values: (string | number)[][]
): Promise<{ updatedRows: number }> {
  const escapedTitle = `'${sheetTitle.replace(/'/g, "''")}'`;

  // Clear existing contents in the target tab first so stale rows aren't left behind
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(`${escapedTitle}!A1:Z`)}:clear`;

  const clearRes = await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  await handleApiResponse(clearRes);

  // Write the full table starting from A1
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(`${escapedTitle}!A1`)}?valueInputOption=USER_ENTERED`;

  const updateRes = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${escapedTitle}!A1`,
      majorDimension: 'ROWS',
      values,
    }),
  });

  const result = await handleApiResponse<{ updatedRows?: number }>(updateRes);
  return { updatedRows: result.updatedRows ?? values.length };
}

export async function appendSheetRows(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  rows: (string | number)[][],
  headersIfEmpty?: string[]
): Promise<{ updatedRows: number }> {
  const escapedTitle = `'${sheetTitle.replace(/'/g, "''")}'`;

  // If headersIfEmpty provided, check if row 1 already has content
  if (headersIfEmpty && headersIfEmpty.length > 0) {
    const existing = await readSheetValues(accessToken, spreadsheetId, sheetTitle, 'A1:Z1');
    if (existing.length === 0 || existing[0].length === 0) {
      const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/${encodeURIComponent(`${escapedTitle}!A1`)}?valueInputOption=USER_ENTERED`;
      const headerRes = await fetch(headerUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${escapedTitle}!A1`,
          majorDimension: 'ROWS',
          values: [headersIfEmpty],
        }),
      });
      await handleApiResponse(headerRes);
    }
  }

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(
    `${escapedTitle}!A1`
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${escapedTitle}!A1`,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  const result = await handleApiResponse<{
    updates?: { updatedRows?: number };
  }>(res);
  return { updatedRows: result.updates?.updatedRows ?? rows.length };
}
