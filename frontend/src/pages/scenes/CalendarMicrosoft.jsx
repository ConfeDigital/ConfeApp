// src/pages/Calendar.js
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import MyCalendar from "../../components/calendar/MyCalendar";
import { Box } from "@mui/material";
import MyModal from "../../components/calendar/ModalMicrosoft";
import ContentSkeleton from "../../components/ContentSkeleton";
import { useMsal } from "@azure/msal-react";

import useDocumentTitle from "../../hooks/useDocumentTitle";

const CalendarMicrosoft = () => {
  useDocumentTitle('Calendario Microsoft');
  
  const [currentEvents, setCurrentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    classNames: "",
    start: "",
    end: "",
    users: [],
  });

  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);

  // Hook de MSAL para adquirir el token
  const { instance, accounts } = useMsal();

  const getAccessToken = async () => {
    const request = {
      scopes: ["Calendars.ReadWrite"],
      account: accounts[0],
    };

    try {
      const response = await instance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      const response = await instance.acquireTokenPopup(request);
      return response.accessToken;
    }
  };

  // Obtiene los eventos desde Microsoft Graph y mapea la respuesta
  const getData = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch("https://graph.microsoft.com/v1.0/me/events", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (!data.value) {
        console.error("Respuesta inesperada de Microsoft Graph:", data);
        setLoading(false);
        return;
      }

      // Se mapean los eventos con las propiedades que requiere FullCalendar
      const events = data.value.map((event) => ({
        id: event.id,
        title: event.subject,
        // Se usan las categorías recibidas; si no existen, se asigna un array vacío
        classNames: event.categories || [],
        // Se asignan directamente las fechas proporcionadas
        start: event.start.dateTime,
        end: event.end.dateTime,
        // Se asigna el flag "allDay" que ya trae Graph (no recalculamos con dayjs)
        allDay: event.isAllDay,
        extendedProps: {
          // Puedes incluir más información según necesites, por ejemplo:
          body: event.body,
          webLink: event.webLink,
          originalStartTimeZone: event.originalStartTimeZone,
          originalEndTimeZone: event.originalEndTimeZone,
        },
      }));
      console.log('Eventos: ')
      console.log(events);

      setCurrentEvents(events);
      // Utiliza las categorías para generar opciones de filtro (se aplanan en un array)

      setLoading(false);
    } catch (error) {
      console.error("Error fetching Microsoft Calendar events:", error);
      setLoading(false);
    }
  };

  const handleOpen = (info) => {
    setOpen(true);
    setFormData({
      title: "",
      classNames: "",
      start: dayjs(info.dateStr),
      end: dayjs(info.dateStr).add(1, "day"),
      users: [],
      id: "",
    });
  };

  const handleOpenEdit = (selected) => {
    setOpenEdit(true);
    setFormData({
      id: selected.event.id,
      title: selected.event.title,
      // Convierte el array de categorías en un string
      classNames: selected.event.classNames.join(" "),
      start: dayjs(selected.event.start),
      end: dayjs(selected.event.end),
      users: selected.event.extendedProps.assigned_users || [],
    });
  };

  const handleClose = () => {
    setOpen(false);
    setOpenEdit(false);
    setFormData({
      id: "",
      title: "",
      classNames: "",
      start: "",
      end: "",
      users: [],
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Actualiza un evento a través de Microsoft Graph
  const handleUpdateEvent = async (updatedEvent) => {
    try {
      const token = await getAccessToken();
      const payload = {
        subject: updatedEvent.title,
        start: {
          dateTime: dayjs(updatedEvent.start).format("YYYY-MM-DDTHH:mm:ss"),
          timeZone: "UTC",
        },
        end: {
          dateTime: dayjs(updatedEvent.end).format("YYYY-MM-DDTHH:mm:ss"),
          timeZone: "UTC",
        },
        categories: updatedEvent.classNames.split(" "),
      };

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${updatedEvent.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        console.log("Event updated successfully");
        getData();
      } else {
        const err = await response.json();
        console.error("Error updating event:", err);
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (calendarRef.current) {
        calendarRef.current.getApi().updateSize();
      }
    });
    
    getData();

    if (calendarContainerRef.current) {
      resizeObserver.observe(calendarContainerRef.current);
    }

    return () => {
      if (calendarContainerRef.current) {
        resizeObserver.unobserve(calendarContainerRef.current);
      }
    };
  }, []);

  return (
    <Box m="20px" ref={calendarContainerRef}>
      {loading ? (
        <ContentSkeleton />
      ) : (
        <>
          <MyModal
            mode="create"
            open={open}
            handleClose={handleClose}
            formData={formData}
            handleChange={handleChange}
            getData={getData}
            getAccessToken={getAccessToken}
          />
          <MyModal
            mode="edit"
            open={openEdit}
            handleClose={handleClose}
            formData={formData}
            handleChange={handleChange}
            getData={getData}
            getAccessToken={getAccessToken}
          />
          <Box sx={{ boxShadow: 3, padding: "20px" }} flex="1">
            <MyCalendar
              myEvents={currentEvents}
              calendarReference={calendarRef}
              dayClickAction={handleOpen}
              eventClickAction={handleOpenEdit}
              handleUpdateEvent={handleUpdateEvent}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default CalendarMicrosoft;
