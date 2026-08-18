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

    // Validasi dari Guest
    const guest = findGuest(id);

    if (!guest) {
      return json({
        success: false,
        code: "NOT_INVITED",
        message: "Guest not found."
      });
    }

    const sheet = getRsvpSheet();
    let exist = findRsvp(id);

    const now = new Date();

    // Belum pernah RSVP → bikin row baru
    if (!exist) {
      sheet.appendRow([
        guest.id,          // A ID
        guest.nama,        // B Nama
        "",                // C Status
        "",                // D Pax
        "",                // E RSVP Time
        "Sudah hadir",      // F Attendance
        now                // G Attendance Time
      ]);

      const row = sheet.getLastRow();

      sheet.getRange(row, 6)
        .setBackground("#34A853")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold");

      sheet.getRange(row, 7)
        .setBackground("#E6F4EA");

      return json({
        success: true,
        nama: guest.nama,
        attendance_time: Utilities.formatDate(
          now,
          Session.getScriptTimeZone(),
          "dd MMMM yyyy • HH.mm"
        )
      });
    }

    // Sudah pernah check-in
    const attendance = String(exist.attendance).trim().toLowerCase();

    if (attendance === "Sudah hadir") {
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

    // Update attendance
    sheet.getRange(exist.row, 6)
      .setValue("Sudah Hadir")
      .setBackground("#34A853")   // Fill hijau
      .setFontColor("#FFFFFF")    // Teks putih
      .setFontWeight("bold");

    sheet.getRange(exist.row, 7)
      .setValue(now)
      .setBackground("#E6F4EA");  // Hijau muda

    return json({
      success: true,
      nama: guest.nama,
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