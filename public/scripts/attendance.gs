function checkAttendance(body) {

  const id = body.id;

  if (!id) {
    return json({
      success: false,
      code: "BAD_REQUEST",
      message: "ID is required."
    });
  }

  const exist = findRsvp(id);

  if (!exist) {
    return json({
      success: false,
      code: "NOT_FOUND",
      message: "RSVP not found."
    });
  }

  const sheet = getRsvpSheet();

  // Kalau sudah check-in sebelumnya
  const attended = sheet.getRange(exist.row, 6).getValue();

  if (attended === true || attended === "TRUE") {

    return json({
      success: false,
      code: "ALREADY_CHECKED_IN",
      message: "Guest already checked in.",
      nama: exist.nama,
      attendance_time: Utilities.formatDate(
        new Date(sheet.getRange(exist.row, 7).getValue()),
        Session.getScriptTimeZone(),
        "dd MMMM yyyy • HH.mm"
      )
    });

  }

  const now = new Date();

  sheet.getRange(exist.row, 6).setValue(true);
  sheet.getRange(exist.row, 7).setValue(now);

  return json({
    success: true,
    nama: exist.nama,
    attendance_time: Utilities.formatDate(
      now,
      Session.getScriptTimeZone(),
      "dd MMMM yyyy • HH.mm"
    )
  });

}