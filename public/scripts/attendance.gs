function checkAttendance(body) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(5000);

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

    if (exist.attendance === true || exist.attendance === "TRUE") {
      return json({
        success: false,
        code: "ALREADY_CHECKED_IN",
        message: "Guest already checked in.",
        nama: exist.nama,
        attendance_time: Utilities.formatDate(
          new Date(exist.attendanceTime),
          Session.getScriptTimeZone(),
          "dd MMMM yyyy • HH.mm"
        )
      });
    }

    const now = new Date();
    const sheet = getRsvpSheet();

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

  } finally {
    lock.releaseLock();
  }
}