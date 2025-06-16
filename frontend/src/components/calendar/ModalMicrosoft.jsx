// src/components/calendar/Modal.js
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import MyDatePickerForm from "./createforms/MyDatePickerForm";
import MySelectForm from "./createforms/MySelectForm";
import MytextForm from "./createforms/MyTextForm";
import MyButton from "./createforms/MyButton";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useSelector } from "react-redux";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function MyModalUnified({
  mode,
  open,
  handleClose,
  formData,
  handleChange,
  getData,
  getAccessToken,
}) {
  const [users, setUsers] = useState([]);
  const loggedInUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    fetchUsers();
  }, [loggedInUser]);

  const fetchUsers = async () => {
    // Ajusta la fuente de usuarios según tu implementación
    try {
      const response = await fetch("/api/users/staff/");
      const data = await response.json();
      const filteredUsers = data.filter((user) => user.id !== loggedInUser.id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmission = async (event) => {
    event.preventDefault();

    const token = await getAccessToken();

    const payload = {
      subject: formData.title,
      start: {
        dateTime: formData.start ? new Date(formData.start).toISOString() : "",
        timeZone: "UTC",
      },
      end: {
        dateTime: formData.end ? new Date(formData.end).toISOString() : "",
        timeZone: "UTC",
      },
      categories: formData.classNames ? formData.classNames.split(" ") : [],
    };

    try {
      let response;
      if (mode === "create") {
        response = await fetch("https://graph.microsoft.com/v1.0/me/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${formData.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }
      if (response.ok) {
        getData();
        handleClose();
      } else {
        const err = await response.json();
        console.error("Error in submission:", err);
      }
    } catch (error) {
      console.error("Error in submission:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${formData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        getData();
        handleClose();
      } else {
        const err = await response.json();
        console.error("Error deleting event:", err);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <form onSubmit={handleSubmission}>
          <Box sx={{ marginBottom: "20px" }}>
            <MytextForm label="Título" name="title" value={formData.title} onChange={handleChange} />
          </Box>

          <Box sx={{ marginBottom: "20px" }}>
            <MySelectForm label="Estado" name="classNames" value={formData.classNames} onChange={handleChange} />
          </Box>

          <Box sx={{ marginBottom: "20px" }}>
            <MyDatePickerForm label="Fecha de Inicio" name="start" value={formData.start} onChange={handleChange} />
          </Box>

          <Box sx={{ marginBottom: "20px" }}>
            <MyDatePickerForm label="Fecha de Término" name="end" value={formData.end} onChange={handleChange} />
          </Box>

          <Box sx={{ marginBottom: "20px" }}>
            <Autocomplete
              multiple
              freeSolo
              id="user-select"
              options={users}
              getOptionLabel={(option) => option.first_name + " " + option.last_name}
              value={formData.users}
              onChange={(event, newValue) => {
                handleChange({ target: { name: "users", value: newValue } });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Seleccionar Usuario" placeholder="Buscar por email" fullWidth />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Box>

          <Box sx={{ marginBottom: "20px", display: "flex", justifyContent: "space-evenly" }}>
            <MyButton label={mode === "create" ? "Crear" : "Editar"} type="submit" />
            {mode === "edit" && (
              <MyButton onClick={handleDelete} label="Eliminar" type="button" color="error" />
            )}
          </Box>
        </form>
      </Box>
    </Modal>
  );
}
