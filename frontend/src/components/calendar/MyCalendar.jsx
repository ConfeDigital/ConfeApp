import { React } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { Box, useTheme } from "@mui/material";
import { tokens } from "../../theme";

const MyCalendar = ({
  myEvents,
  calendarReference,
  dayClickAction,
  eventClickAction,
  handleUpdateEvent,
  isEventAllDay,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleEventDrop = (eventInfo) => {
  const endDate = eventInfo.event.end
    ? eventInfo.event.end.toISOString()
    : new Date(
        eventInfo.event.start.getTime() + 24 * 60 * 60 * 1000
      ).toISOString(); // Si no tiene end, se añade 1 día

  const updatedEvent = {
    id: eventInfo.event.id,
    subject: eventInfo.event.title,
    category: eventInfo.event.classNames.join(" "),
    start_time: eventInfo.event.start.toISOString(),
    end_time: endDate,
  };
  handleUpdateEvent(updatedEvent);
};

const handleEventResize = (eventInfo) => {
  const updatedEvent = {
    id: eventInfo.event.id,
    subject: eventInfo.event.title,
    category: eventInfo.event.classNames.join(" "),
    start_time: eventInfo.event.start.toISOString(),
    end_time: eventInfo.event.end ? eventInfo.event.end.toISOString() : new Date(eventInfo.event.start.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
  handleUpdateEvent(updatedEvent);
};


  return (
    <Box
      sx={{
        "--fc-bg-color": theme.palette.background.paper,
        "--fc-border-color": theme.palette.divider,
        "--fc-daygrid-border-color": theme.palette.divider,
        "--fc-daygrid-day-bg-color": theme.palette.background.default,
        
        "--fc-button-bg-color": theme.palette.primary.main,
        "--fc-button-text-color": theme.palette.primary.contrastText,
        "--fc-button-border-color": theme.palette.divider,
        "--fc-button-hover-bg-color": theme.palette.primary.dark,
        "--fc-button-active-bg-color": theme.palette.primary.dark,

        "--fc-event-bg-color": theme.palette.secondary.light,
        "--fc-event-text-color": theme.palette.secondary.contrastText,
        "--fc-event-border-color": theme.palette.secondary.light,
      

        '.fc-multimonth-daygrid': {
          backgroundColor: theme.palette.background.paper,
          borderColor:     theme.palette.divider,
        },
        '.fc-multimonth-daygrid-day': {
          backgroundColor: theme.palette.background.default,
          borderColor:     theme.palette.divider,
        },
        '.fc-list-day-cushion': {
          backgroundColor: theme.palette.background.paper,
        },
        '.fc-list-event': {
          backgroundColor: colors.primaryBackground[700],
          color:           theme.palette.background.contrastText,
          borderColor:     theme.palette.divider,
        },
        "--fc-list-event-hover-bg-color": colors.primaryBackground[300],
      }}
    >
    <FullCalendar
      ref={calendarReference}
      height="75vh"
      locale={esLocale}
      plugins={[
        dayGridPlugin,
        timeGridPlugin,
        interactionPlugin,
        listPlugin,
        multiMonthPlugin,
      ]}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth,multiMonthYear",
      }}
      initialView="dayGridMonth"
      editable={true}
      selectable={true}
      selectMirror={true}
      dayMaxEvents={true}
      dateClick={dayClickAction}
      eventClick={eventClickAction}
      events={myEvents}
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
    />
    </Box>
  );
};

export default MyCalendar;