function doGet(e) {

  const action = e.parameter.action;

  if (action == "guest") {
    return getGuest(e);
  }

  if (action == "wish") {
    // e must be forwarded: getWish reads limit/before/beforeRow off e.parameter
    return getWish(e);
  }

  return json({
    success: false,
    message: "Unknown action"
  });

}


function getGuest(e) {

  const id = e.parameter.id;

  if (!id) {
    return json({
      success: false,
      message: "Invitation ID is required"
    });
  }

  const guest = findGuest(id);

  if (!guest) {
    return json({
      success: false,
      message: "Invitation not found"
    });
  }

  return json({
    success: true,
    id: guest.id,
    nama: guest.nama
  });

}
