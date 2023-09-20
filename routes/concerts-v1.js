const express = require("express");
const {
  selectConcerts,
  selectShowsByConcert,
  selectConcert,
  selectLocationById,
  selectLocationSeatsRows,
  selectUnavailableSeats,
  countTotalSeats,
  createReservation,
  updateSeat,
  selectReservation,
  selectLocationSeatsByReservation,
  createBooking,
  updateBookingSeat,
  createTicket,
  deleteReservation,
  selectLocationSeatsRow,
} = require("../helpers/mysql");

const router = express.Router();

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomChars() {
  const chars = [
    "q",
    "w",
    "e",
    "r",
    "t",
    "y",
    "u",
    "i",
    "o",
    "p",
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    "z",
    "x",
    "c",
    "v",
    "b",
    "n",
    "m",
  ];

  const text = `${chars[getRandomInt(1, chars.length - 1)]}${
    chars[getRandomInt(1, chars.length - 1)]
  }${chars[getRandomInt(1, chars.length - 1)]}${
    chars[getRandomInt(1, chars.length - 1)]
  }${chars[getRandomInt(1, chars.length - 1)]}${
    chars[getRandomInt(1, chars.length - 1)]
  }${chars[getRandomInt(1, chars.length - 1)]}${
    chars[getRandomInt(1, chars.length - 1)]
  }${chars[getRandomInt(1, chars.length - 1)]}${
    chars[getRandomInt(1, chars.length - 1)]
  }`;

  return text;
}

/* 
  GET /api/v1/concerts
*/
router.get("/", async (req, res) => {
  try {
    // получаем все концерты
    let concerts = await selectConcerts();

    // проходим по концертам
    for (let i in concerts) {
      const concert = concerts[i];
      // получаем шоу по id концерта
      const shows = await selectShowsByConcert({
        concertId: concert.id,
      });

      // получаем локацию
      const location = await selectLocationById({
        id: concert.location_id,
      });

      if (shows.length) {
        // если есть шоу, добавляем ключ shows и сортируем полученные значения
        concerts[i].shows = shows
          // сортируем по дате
          .sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
          )
          // удаляем ключ concert_id
          .filter((item) => {
            delete item.concert_id;
            return true;
          });
      }

      if (location.length) {
        // если локация найдена - устанавливаем ключ location
        concerts[i].location = location[0];
        // удаляем ключ location_id
        delete concerts[i].location_id;
      }
    }

    // отправляем ответ
    res.json({
      concerts: concerts.sort((a, b) => a.artist.localeCompare(b.artist)),
    });
  } catch (e) {
    res.status(500).json({
      error: "An error ocurred",
    });
  }
});

/* 
  GET /api/v1/concerts/:concert

  Path params: 
  - concert: id of concert
*/
router.get("/:concert", async (req, res) => {
  // ищем концерт по id
  let concert = await selectConcert({
    id: req.params["concert"],
  });

  // если концерт не найден - отправляем ошибку
  if (!concert[0]) {
    return res.status(404).json({
      error: "A concert with this ID does not exist",
    });
  }

  concert = concert[0];

  // получаем шоу
  const shows = await selectShowsByConcert({
    concertId: concert.id,
  });

  // получаем локацию
  const location = await selectLocationById({
    id: concert.location_id,
  });

  // отправляем ответ
  res.json({
    concert: {
      id: concert.id,
      location,
      artist: concert.artist,
      shows: shows
        .sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        )
        .map((item) => ({
          id: item.id,
          start: item.start,
          end: item.end,
        })),
    },
  });
});

/* 
  GET /api/v1/concerts/:concert/shows/:show/seating

  Path params: 
  - concert: id of concert
  - show: id of show
*/
router.get("/:concert/shows/:show/seating", async (req, res) => {
  const rows = await selectLocationSeatsRows({
    showId: req.params.show,
  });

  for (let i in rows) {
    const row = rows[i];

    const unavailableSeats = await selectUnavailableSeats({
      locationSeatsRowId: row.id,
    });
    const total = await countTotalSeats({
      locationSeatsRowId: row.id,
    });

    console.log(total);

    row.unavailableSeats = unavailableSeats.map((item) => item.number);
    row.total = total;
  }

  res.json({
    rows: rows.map((item) => ({
      id: item.order,
      name: item.name,
      seats: {
        total: item.total,
        unavailable: item.unavailableSeats,
      },
    })),
  });
});

/* 
  POST /api/v1/concerts/:concert/shows/:show/reservation

  Path params: 
  - concert: id of concert
  - show: id of show

  Body:
  application/json
  {
    reservations: [object];
    reservation_token: string;
    duration: number;
  }
*/
router.post("/:concert/shows/:show/reservation", async (req, res) => {
  try {
    const { reservations, reservation_token, duration } = req.body;

    if (reservation_token) {
      
    } else {
      const error422 = {
        error: "Validation failed",
        fields: {},
      };

      if (!reservations) {
        error422.fields["reservations"] = `The reservations field is required`;
      }

      if (reservations && typeof reservations !== "object") {
        error422.fields[
          "reservations"
        ] = `The reservations field should be an object`;
      }

      if (duration) {
        if (
          !Number(duration) ||
          Number(duration) < 1 ||
          Number(duration) > 300
        ) {
          error422.fields[
            "duration"
          ] = `The duration must be between 1 and 300.`;
        }
      }

      const rows = await selectLocationSeatsRows({
        showId: req.params.show,
      });

      if (!rows[0]) {
        return res.status(404).json({
          error: "A concert or show with this ID does not exist",
        });
      }

      if (reservations && typeof reservations == "object") {
        for (let i in reservations) {
          console.log(reservations[i]);
          if (!reservations[i].row || !reservations[i].seat) {
            return (error422.fields[
              "reservations"
            ] = `reservations[${i}] is invalid`);
          }

          const unavailableSeats = await selectUnavailableSeats({
            locationSeatsRowId: rows[reservations[i].row - 1].id,
          });

          if (
            unavailableSeats.filter(
              (item) => item.number == reservations[i].seat
            ).length > 0
          ) {
            error422.fields[
              "reservations"
            ] = `Seat ${reservations[i].seat} in row ${reservations[i].row} is already taken.`;
          }
        }
      }

      if (error422.fields["reservations"] || error422.fields["duration"]) {
        return res.status(422).json(error422);
      }

      const token = getRandomChars();
      let expriesIn;
      if (duration) {
        expriesIn = (new Date().getTime() + duration * 1000) / 1000;
      } else {
        expriesIn = (new Date().getTime() + 60000 * 5) / 1000;
      }

      const reserv = await createReservation({
        token,
        expires: expriesIn,
      });

      console.log(reserv);

      for (let i in reservations) {
        const update = await updateSeat({
          locationSeatsRowId: rows[reservations[i].row - 1].id,
          reservationId: reserv.insertId,
          seatNumber: reservations[i].seat,
        });
        console.log(update);

        setTimeout(
          async () => {
            const update2 = await updateSeat({
              locationSeatsRowId: rows[reservations[i].row - 1].id,
              reservationId: "NULL",
              seatNumber: reservations[i].seat,
            });
            console.log(update2);

            await deleteReservation({
              id: reserv.insertId,
            });
          },
          duration ? duration * 1000 : 60000 * 5
        );
      }

      res.status(201).json({
        reserved: true,
        reservation_token: token,
        reserved_until: new Date(expriesIn * 1000),
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: "",
    });
  }
});

/* 
  POST /api/v1/concerts/:concert/shows/:show/booking

  Path params: 
  - concert: id of concert
  - show: id of show

  Body:
  application/json
  {
    reservation_token: string;
    name: string;
    address: string;
    city: string;
    zip: string;
    country: string;
  }
*/
router.post("/:concert/shows/:show/booking", async (req, res) => {
  const { reservation_token, name, address, city, zip, country } = req.body;

  console.log(name, address, city, zip, country);

  const error422 = {
    error: "Validation failed",
    fields: {},
  };

  if (!reservation_token) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  if (!name) {
    error422.fields["name"] = "The name field is required.";
  }

  if (!address) {
    error422.fields["address"] = "The address field is required.";
  }
  if (!city) {
    error422.fields["city"] = "The city field is required.";
  }
  if (!zip) {
    error422.fields["zip"] = "The zip field is required.";
  }
  if (!country) {
    error422.fields["country"] = "The country field is required.";
  }

  if (
    error422.fields["name"] ||
    error422.fields["address"] ||
    error422.fields["city"] ||
    error422.fields["zip"] ||
    error422.fields["country"]
  ) {
    return res.status(422).json(error422);
  }

  const reservation = await selectReservation({
    token: reservation_token,
  });
  console.log(reservation);
  if (!reservation[0]) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }
  const seats = await selectLocationSeatsByReservation({
    reservationId: reservation[0].id,
  });
  console.log(seats);

  const booking = await createBooking({
    name,
    address,
    city,
    zip,
    country,
  });

  console.log(seats);

  let show = await selectShowsByConcert({
    concertId: req.params.concert,
  });

  show = show.filter((item) => item.id == req.params.show);

  if (!show[0]) {
    return res.status(404).json({
      error: "A concert or show with this ID does not exist",
    });
  }

  show = show[0];

  let concert = await selectConcert({
    id: req.params.concert,
  });

  if (!concert[0]) {
    return res.status(404).json({
      error: "A concert or show with this ID does not exist",
    });
  }

  concert = concert[0];

  let location = await selectLocationById({
    id: concert.location_id,
  });

  if (!location[0]) {
    return res.status(404).json({
      error: "A concert or show with this ID does not exist",
    });
  }

  location = location[0];

  const tickets = [];

  for (let i in seats) {
    const code = getRandomChars().toUpperCase();
    const ticket = await createTicket({
      code: code,
      bookingId: booking.insertId,
    });
    console.log(ticket);
    const update = await updateBookingSeat({
      locationSeatsRowId: seats[i].location_seat_row_id,
      seatNumber: seats[i].number,
      ticketId: ticket.insertId,
    });

    console.log(update);

    const row = await selectLocationSeatsRow({
      id: seats[i].location_seat_row_id,
    });

    tickets.push({
      id: ticket.insertId,
      code: code,
      name: name,
      created_at: new Date().toISOString(),
      row: {
        id: seats[i].location_seat_row_id,
        name: row[0]?.name,
      },
      seat: seats[i].number,
      show: {
        id: show.id,
        start: show.start,
        end: show.end,
        concert: {
          id: concert.id,
          artist: concert.artist,
          location: {
            id: location.id,
            name: location.name,
          },
        },
      },
    });
  }

  await deleteReservation({
    id: reservation[0].id,
  });

  res.status(201).json({
    tickets,
  });
});

module.exports = router;
