import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Box } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { formatCanonicalPhoneNumber } from '../phone_number/phoneUtils'; // Adjust the import path if necessary

const UserListDialog = ({ open, onClose, title, userList }) => {
    const navigate = useNavigate();

    const columns = [
        { field: "id", headerName: "ID", width: 50 },
        {
            field: "nombre_completo",
            headerName: "Nombre",
            flex: 1,
            minWidth: 200,
            cellClassName: "name-column--cell",
        },
        {
            field: "edad",
            headerName: "Edad",
            type: "number",
            headerAlign: "left",
            align: "left",
            width: 70,
        },
        {
            field: "discapacidad",
            headerName: "Discapacidad",
            flex: 1,
            minWidth: 160,
        },
        {
            field: "telefono",
            headerName: "Teléfono",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                return <span>{formatCanonicalPhoneNumber(params.value)}</span>;
            },
        },
        {
            field: "email",
            headerName: "Correo",
            flex: 1,
            minWidth: 120,
        },
        {
            field: "municipio",
            headerName: "Domicilio",
            flex: 1,
            minWidth: 120,
        },
        {
            field: "fecha_registro",
            headerName: "Registro",
            flex: 1,
            minWidth: 100,
        },
        {
            field: "estado",
            headerName: "Estado",
            width: 120,
        },
        {
            field: "ciclo",
            headerName: "Ciclo",
            width: 120,
        },
    ];

    const handleRowClick = (params) => {
        navigate(`/candidatos/${params.row.id}`);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent sx={{ height: 400, width: '100%' }}>
                {userList.length > 0 ? (
                    <Box
                        display="grid"
                        height="inherit"
                        className="custom-datagrid"
                    >
                        <DataGrid
                            rows={userList}
                            columns={columns}
                            disableRowSelectionOnClick
                            onRowClick={handleRowClick}
                            slots={{ toolbar: GridToolbar }}
                            slotProps={{
                                toolbar: {
                                    showQuickFilter: true,
                                },
                            }}
                            initialState={{
                                columns: {
                                    columnVisibilityModel: {
                                        id: false,
                                        email: false,
                                        fecha_registro: false,
                                    },
                                },
                            }}
                        />
                    </Box>
                ) : (
                    <Typography>No hay usuarios en esta categoría.</Typography>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default UserListDialog;