function createWish(body) {

  const id = body.id;
  const ucapan = body.ucapan;

  if (!id || !ucapan || !ucapan.trim()) {
    return json({
      success: false,
      code: "BAD_REQUEST",
      message: "Missing required fields."
    });
  }

  const guest = findGuest(id);

  if (!guest) {
    return json({
      success: false,
      code: "NOT_INVITED",
      message: "You're not invited."
    });
  }

  getWishSheet().appendRow([
    id,
    guest.nama,
    ucapan.trim(),
    new Date()
  ]);

  return json({
    success: true,
    action: "created"
  });
}


function getWish(e) {

  const sheet = getWishSheet();
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) {
    return json({
      success: true,
      data: [],
      hasMore: false,
      nextCursor: null
    });
  }

  const limit = Math.min(
    Math.max(parseInt(e.parameter.limit || "10", 10), 1),
    20
  );

  const before = e.parameter.before
    ? decodeURIComponent(e.parameter.before)
    : null;

  const data = rows
    .slice(1)
    .map((row, index) => ({
      rowNumber: index + 2,
      id: row[0],
      nama: row[1],
      ucapan: row[2],
      createdAt: row[3]
    }))
    .filter(item => {

      if (!item.createdAt) {
        return false;
      }

      if (!before) {
        return true;
      }

      const beforeTime = new Date(before).getTime();
      const currentTime = new Date(item.createdAt).getTime();

      return (
        currentTime < beforeTime ||
        (
          currentTime === beforeTime &&
          item.rowNumber < parseInt(e.parameter.beforeRow || "999999999", 10)
        )
      );
    })
    .sort((a, b) => {

      const timeDiff =
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime();

      if (timeDiff !== 0) {
        return timeDiff;
      }

      return b.rowNumber - a.rowNumber;
    });

  const page = data.slice(0, limit);

  const hasMore = data.length > limit;

  let nextCursor = null;
  let nextCursorRow = null;

  if (page.length > 0) {

    const last = page[page.length - 1];

    nextCursor = new Date(last.createdAt).toISOString();
    nextCursorRow = last.rowNumber;

  }

  return json({
    success: true,

    data: page.map(row => ({
      nama: row.nama,
      ucapan: row.ucapan,
      created_at: Utilities.formatDate(
        new Date(row.createdAt),
        Session.getScriptTimeZone(),
        "dd MMMM yyyy • HH.mm"
      )
    })),

    hasMore,

    nextCursor,

    nextCursorRow
  });
}