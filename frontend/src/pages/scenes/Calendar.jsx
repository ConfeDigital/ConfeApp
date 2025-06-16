import { useState, useEffect, useRef } from "react";
import axios from "../../api";
import dayjs from "dayjs";
import MyCalendar from "../../components/calendar/MyCalendar";
import { Box, Paper } from "@mui/material";
import MultiSelectForm from "../../components/calendar/MultiSelectForm";
import DatePickerForm from "../../components/calendar/DatePickerForm";
import MyModal from "../../components/calendar/Modal"; // Renamed to avoid confusion
import ContentSkeleton from "../../components/ContentSkeleton";

import useDocumentTitle from "../../components/hooks/useDocumentTitle";

const Calendar = () => {
  useDocumentTitle('Calendario');

  const [currentEvents, setCurrentEvents] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    subject: "",
    category: "",
    start_time: null,
    end_time: null,
    attendees: [],
    organizer_details: "",
  });

  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);

  const NO_CATEGORY = "Sin Categoría";

  const getData = async () => {
    try {
      const response = await axios.get(`api/appointments/`);
      const eventsData = response.data.map((event) => ({
        ...event,
        start: event.start_time,
        end: event.end_time,
        title: event.subject,
        allDay: isEventAllDay(event.start_time, event.end_time),
        classNames: event.category ? [event.category] : [NO_CATEGORY], // Adapt category for calendar
        _category: event.category, // Store the actual category for filtering
      }));
      setCurrentEvents(eventsData);

      const uniqueCategories = [...new Set(response.data.map((event) => event.category).filter(Boolean))];
      setCategoryOptions([NO_CATEGORY, ...uniqueCategories]);
      setSelectedCategory([NO_CATEGORY, ...uniqueCategories]); // Select all by default
      setLoading(false);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const isEventAllDay = (start, end) => {
    // Convierte a formato "HH:mm" para comparar solo las horas y minutos
    const startTime = dayjs(start).format("HH:mm");
    const endTime = dayjs(end).format("HH:mm");
    return (startTime === "00:00" && endTime === "00:00");
  };  

  const handleOpen = (info) => {
    setOpen(true);
    setFormData({
      subject: "",
      category: "",
      start_time: dayjs(info.dateStr), // Parse to Dayjs object
      end_time: dayjs(info.dateStr).add(1, "day"), // Parse to Dayjs object
      attendees: [],
    });
  };

  const handleOpenEdit = async (selected) => {
    const eventId = selected.event.id;
    try {
      const response = await axios.get(`api/appointments/${eventId}/`);
      const appointmentData = response.data;
      setOpenEdit(true);
      setFormData({
        id: appointmentData.id,
        subject: appointmentData.subject,
        category: appointmentData.category || "",
        start_time: dayjs(appointmentData.start_time),
        end_time: dayjs(appointmentData.end_time),
        attendees: appointmentData.attendees_details, // Use the detailed attendee info
        organizer_details: appointmentData.organizer_details,
      });
    } catch (error) {
      console.error("Error fetching appointment details for edit:", error);
      // Optionally handle the error (e.g., display a message)
    }
  };

  const handleClose = () => {
    setOpen(false);
    setOpenEdit(false);
    setFormData({
      id: "",
      subject: "",
      category: "",
      start_time: null,
      end_time: null,
      attendees: [],
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUpdateEvent = async (updatedEvent) => {
    try {
      const response = await axios.get(`api/appointments/${updatedEvent.id}/`);
      const attendeeIds = response.data.attendees_details.map((user) => user.id);
      await axios.put(`api/appointments/update/${updatedEvent.id}/`, {
        subject: updatedEvent.subject,           // Usar subject en lugar de title
        start_time: updatedEvent.start_time,       // Usar start_time en lugar de start
        end_time: updatedEvent.end_time,           // Usar end_time en lugar de end
        attendees: attendeeIds,
      });
      console.log("Evento actualizado correctamente");
      getData();
    } catch (error) {
      console.error("Error al actualizar el evento:", error);
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

  const filteredEvents = currentEvents.filter((event) => {
    if (selectedCategory.includes(NO_CATEGORY)) {
      if (!event._category) {
        return true;
      }
    }
    return event._category ? selectedCategory.includes(event._category) : false;
  });

  return (
    <Box sx={{ m: 2 }} ref={calendarContainerRef}>
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
          />
          <MyModal
            mode="edit"
            open={openEdit}
            handleClose={handleClose}
            formData={formData}
            handleChange={handleChange}
            getData={getData}
            isEventAllDay={isEventAllDay}
          />
          <Box >
            <Paper >
              <MultiSelectForm
                label={"Categoría"}
                options={categoryOptions}
                setSelectedValue={setSelectedCategory}
                selectedValue={selectedCategory}
              />
            </Paper>
            <Paper sx={{ mt: 2 }} flex="1">
              <MyCalendar
                myEvents={filteredEvents}
                calendarReference={calendarRef}
                dayClickAction={handleOpen}
                eventClickAction={handleOpenEdit}
                handleUpdateEvent={handleUpdateEvent}
                isEventAllDay={isEventAllDay}
              />
            </Paper>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Calendar;