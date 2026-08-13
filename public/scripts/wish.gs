function createWish(body) {

  const id = body.id;
  const ucapan = body.ucapan;

  if (!id || !ucapan) {
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

function getWish() {

  const rows = getWishSheet().getDataRange().getValues();

  if (rows.length <= 1) {
    return json({
      success: true,
      data: []
    });
  }

  const data = rows
    .slice(1)
    .sort((a, b) => new Date(b[3]) - new Date(a[3]))
    .slice(0, 10)
    .map(row => ({
      nama: row[1],
      ucapan: row[2],
      created_at: Utilities.formatDate(
        new Date(row[3]),
        Session.getScriptTimeZone(),
        "dd MMMM yyyy • HH.mm"
      )
    }));

  return json({
    success: true,
    data
  });
}