const mysql = require("mysql2/promise");

// данные для подключения к mysql
const poolConfig = {
  connectionLimit: 100,
  host: "79.137.202.217",
  user: "wsk-c_usr",
  password: "tt5gR9kQlE7dUuQz",
  database: "wsk-c",
};

const pool = mysql.createPool(poolConfig);

// все концерты
async function selectConcerts() {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows, fields] = await connection.execute("SELECT * FROM `concerts`");

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// определенный концерт по айди
async function selectConcert({ id }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows, fields] = await connection.execute(
      "SELECT * FROM `concerts` WHERE `id` =" + id
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// все шоу по айди концерта
async function selectShowsByConcert({ concertId }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows, fields] = await connection.execute(
      "SELECT * FROM `shows` WHERE `concert_id` = " + concertId
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// шоу по айди
async function selectShows({ id }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows, fields] = await connection.execute(
      "SELECT * FROM `shows` WHERE `id` = " + id
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// локация по айди
async function selectLocationById({ id }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows, fields] = await connection.execute(
      "SELECT * FROM `locations` WHERE `id` = " + id
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// ряды по айди шоу
async function selectLocationSeatsRows({ showId }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows, fields] = await connection.execute(
      "SELECT * FROM `location_seat_rows` WHERE `show_id` = " + showId
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// занятые места
async function selectUnavailableSeats({ locationSeatsRowId }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows, fields] = await connection.execute(
      "SELECT * FROM `location_seats` WHERE `location_seat_row_id` = " +
        locationSeatsRowId +
        " AND (`ticket_id` IS NOT NULL OR `reservation_id` IS NOT NULL);"
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// количество мест
async function countTotalSeats({ locationSeatsRowId }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "SELECT COUNT(*) FROM `location_seats` WHERE `location_seat_row_id` = " +
        locationSeatsRowId
    );

    connection.release();

    return rows[0]["COUNT(*)"];
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// создать резервацию
async function createReservation({ token, expires }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "INSERT INTO `reservations` (`token`, `expires_at`) VALUES (?, ?)",
      [token, new Date(expires * 1000).toISOString()]
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// обновить место
async function updateSeat({ locationSeatsRowId, seatNumber, reservationId }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "UPDATE `location_seats` SET `reservation_id` = " +
        (reservationId == "NULL" ? "NULL" : `'${reservationId}'`) +
        " WHERE `location_seat_row_id` = " +
        locationSeatsRowId +
        " AND `number` = " +
        seatNumber
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// обновить место
async function updateBookingSeat({ locationSeatsRowId, seatNumber, ticketId }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "UPDATE `location_seats` SET `reservation_id` = NULL, `ticket_id` = ? WHERE `location_seat_row_id` = ? AND `number` = ?",
      [ticketId, locationSeatsRowId, seatNumber]
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// обновить место
async function updateBookingSeat2({ locationSeatsRowId, seatNumber }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "UPDATE `location_seats` SET `reservation_id` = NULL, `ticket_id` = NULL WHERE `location_seat_row_id` = ? AND `number` = ?",
      [locationSeatsRowId, seatNumber]
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// получить резервацию по токену
async function selectReservation({ token }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "SELECT * FROM `reservations` WHERE `token` = '" + token + "'"
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// получить места по резервации
async function selectLocationSeatsByReservation({ reservationId }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "SELECT * FROM `location_seats` WHERE `reservation_id` = '" +
        reservationId +
        "'"
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// создать бронь
async function createBooking({ name, address, city, zip, country }) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "INSERT INTO `bookings` (`name`, `address`, `city`, `zip`, `country`) VALUES (?, ?, ?, ?, ?)",
      [name, address, city, zip, country]
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// создать билет
async function createTicket({ bookingId, code }) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "INSERT INTO `tickets` (`booking_id`, `code`) VALUES (?, ?)",
      [bookingId, code]
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// удалить резервацию
async function deleteReservation({ id }) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "DELETE FROM `reservations` WHERE `reservations`.`id` = ?",
      [id]
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// получить ряд по айди
async function selectLocationSeatsRow({ id }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows, fields] = await connection.execute(
      "SELECT * FROM `location_seat_rows` WHERE `id` = " + id
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// бронирование по имени
async function selectBookingByName({ name }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows, fields] = await connection.execute(
      "SELECT * FROM `bookings` WHERE `name` = " + name
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// билеты по айди брони
async function selectTicketsByBooking({ bookingId }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "SELECT * FROM `tickets` WHERE `booking_id` = '" + bookingId + "'"
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// места по айди билета
async function selectLocationSeatsByTicket({ ticketId }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      "SELECT * FROM `location_seats` WHERE `ticket_id` = '" + ticketId + "'"
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

// удаление билета
async function deleteTicket({ ticketId }) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "DELETE FROM `tickets` WHERE `tickets`.`id` = ?",
      [ticketId]
    );

    connection.release();

    return rows;
  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error("Ошибка при выполнении запроса:", error);
    throw error;
  }
}

module.exports = {
  selectConcerts,
  selectShowsByConcert,
  selectConcert,
  selectLocationById,
  selectLocationSeatsRows,
  selectUnavailableSeats,
  countTotalSeats,
  updateBookingSeat2,
  selectLocationSeatsByTicket,
  createReservation,
  updateSeat,
  selectReservation,
  selectTicketsByBooking,
  deleteTicket,
  selectBookingByName,
  createBooking,
  selectLocationSeatsByReservation,
  updateBookingSeat,
  selectShows,
  createTicket,
  selectLocationSeatsRow,
  deleteReservation,
};
