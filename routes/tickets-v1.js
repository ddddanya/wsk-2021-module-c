const express = require("express");
const {
  selectBookingByName,
  selectTicketsByBooking,
  selectLocationSeatsByTicket,
  selectLocationSeatsRow,
  selectConcert,
  selectShows,
  selectLocationById,
  deleteTicket,
  updateBookingSeat2,
} = require("../helpers/mysql");

const router = express.Router();

/* 
  POST /api/v1/tickets/

  Body:
  application/json
  {
    name: string;
    code: string;
  }
*/
router.post("/", async (req, res) => {
  const { code, name } = req.body;

  // получаем бронь по имени
  const booking = await selectBookingByName({
    name: `"${name}"`,
  });

  // если не нашлась - отправляем ошибку
  if (!booking[0]) {
    return res.json({
      error: "Unauthorized",
    });
  }

  // получаем билеты по бронированию
  const tickets = await selectTicketsByBooking({
    bookingId: booking[0].id,
  });

  console.log(tickets);

  // ищем билет который пришел в body. если не найден - отправляем ошибку
  if (!tickets.filter((item) => item.code == code)[0]) {
    return res.json({
      error: "Unauthorized",
    });
  }

  const tic = [];

  // проходим по всем билетам
  for (let i in tickets) {
    // получаем всю необходимую информацию
    const seat = await selectLocationSeatsByTicket({
      ticketId: tickets[i].id,
    });

    const row = await selectLocationSeatsRow({
      id: seat[0].location_seat_row_id,
    });

    let show = await selectShows({
      id: row[0].show_id,
    });
    show = show[0];

    let concert = await selectConcert({
      id: show.concert_id,
    });
    concert = concert[0];

    let location = await selectLocationById({
      id: concert.location_id,
    });
    location = location[0];

    // добавляем в массив для ответа
    tic.push({
      id: tickets[i].id,
      code: tickets[i].code,
      name: name,
      created_at: tickets[i].created_at,
      seat: seat[0].number,
      row: {
        id: row[0].id,
        name: row[0].name,
      },
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

  // отправляем ответ
  res.json({
    tickets: tic,
  });
});

/* 
  POST /api/v1/tickets/:id/cancel

  Path params:
  - id: ticket id

  Body:
  application/json
  {
    name: string;
    code: string;
  }
*/
router.post("/:id/cancel", async (req, res) => {
  const { code, name } = req.body;

  const booking = await selectBookingByName({
    name: `"${name}"`,
  });

  if (!booking[0]) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const tickets = await selectTicketsByBooking({
    bookingId: booking[0].id,
  });

  console.log(tickets);

  if (!tickets.filter((item) => item.code == code)[0]) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const ticket = tickets.filter((item) => item.id == req.params.id)[0];

  if (!ticket) {
    return res.status(404).json({
      error: "A ticket with this ID does not exist",
    });
  }

  const seat = await selectLocationSeatsByTicket({
    ticketId: ticket.id,
  });

  await updateBookingSeat2({
    locationSeatsRowId: seat[0].location_seat_row_id,
    seatNumber: seat[0].number,
    ticketId: `NULL`,
  });

  await deleteTicket({
    ticketId: ticket.id,
  });

  res.status(204).send();
});

module.exports = router;
