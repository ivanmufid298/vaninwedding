function doPost(e) {
  try {

    if (!e.postData || !e.postData.contents) {
      return json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Request body is empty."
      });
    }

    const body = JSON.parse(e.postData.contents);

    // Routing POST
    const action = e.parameter.action || "rsvp";

    if (action === "wish") {
      return createWish(body);
    }

    if (action === "attendance") {
      return checkAttendance(body);
    }

    if (action !== "rsvp") {
      return json({
        success: false,
        code: "INVALID_ACTION",
        message: "Unknown action."
      });
    }

    if (action === "attendance") {
      return checkAttendance(body);
    }

    const id = body.id;
    const status = body.status;
    const pax = body.pax;

    if (!id || !status || !pax) {
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

    const sheet = getRsvpSheet();
    const exist = findRsvp(id);

    if (exist) {

      sheet.getRange(exist.row, 2).setValue(guest.nama);
      sheet.getRange(exist.row, 3).setValue(status);
      sheet.getRange(exist.row, 4).setValue(pax);
      sheet.getRange(exist.row, 5).setValue(new Date());

      return json({
        success: true,
        action: "updated"
      });

    }

    sheet.appendRow([
      id,
      guest.nama,
      status,
      pax,
      new Date()
    ]);

    return json({
      success: true,
      action: "created"
    });

  } catch (err) {

    return json({
      success: false,
      code: "SERVER_ERROR",
      message: err.toString()
    });

  }
}