# Backend (Google Apps Script)

The RSVP form talks to a Google Apps Script web app backed by one spreadsheet with two sheets:

- **Guest** — `ID`, `Nama`. The guest list every invitation link is checked against.
- **RSVP** — `ID`, `Nama`, `Status`, `Pax`, `Timestamp`. Where confirmations land.

The web app URL lives in `src/lib/rsvp.ts` and can be overridden with `NEXT_PUBLIC_RSVP_ENDPOINT`.
Apps Script mints a **new** `/exec` URL for every *new* deployment, so if you deploy fresh rather
than updating the existing deployment, set that env var instead of editing code.

## Required change: look a guest up by name

The site supports links in two shapes:

```
?to=ivantest&id=IB001   → resolved by id
?to=ivantest            → resolved by name, then the id is written back into the URL
```

The second shape needs the script to accept a `nama` parameter. **Until the script below is
deployed, a link without `&id=` will be treated as not invited.**

### `helper.gs` — add this function

```js
function findGuestByName(nama) {

  const data = getGuestSheet().getDataRange().getValues();
  const needle = String(nama).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {

    if (String(data[i][1]).trim().toLowerCase() === needle) {

      return {
        row: i + 1,
        id: data[i][0],
        nama: data[i][1]
      };

    }

  }

  return null;

}
```

### `guest.gs` — replace `getGuest` with this

```js
function getGuest(e){

    const id = e.parameter.id;
    const nama = e.parameter.nama;

    if(!id && !nama){

        return json({
            success:false,
            message:"Invitation ID or name is required"
        });

    }

    const guest = id ? findGuest(id) : findGuestByName(nama);

    if(!guest){

        return json({
            success:false,
            message:"Invitation not found"
        });

    }

    return json({

        success:true,
        id:guest.id,
        nama:guest.nama

    });

}
```

After pasting, **Deploy → Manage deployments → edit the existing deployment → Deploy** so the
`/exec` URL stays the same.

## Notes

- The site POSTs with `Content-Type: text/plain`, not `application/json`. Apps Script has no
  `doOptions` handler, so a JSON content type would trigger a CORS preflight it cannot answer and
  every submission would fail in the browser. `e.postData.contents` still parses identically.
- `doPost` upserts on `ID`, so re-confirming updates the guest's row instead of adding duplicates.
- Status is stored as `Hadir` / `Tidak Hadir`.
