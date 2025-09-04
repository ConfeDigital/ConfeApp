import React from "react";
import {
    Box,
    Grid2 as Grid,
    TextField,
} from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";

const IdentificationForm = () => {
    const { control } = useFormContext();

    return (
        <Box>
            <Grid container spacing={2}>
                <Grid xs={12}>
                    <Controller
                        name="curp"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <TextField
                                fullWidth
                                label="CURP"
                                {...field}
                                error={!!error}
                                helperText={error ? error.message : null}
                                slotProps={{ htmlInput: { maxLength: 18 } }}
                            />
                        )}
                    />
                </Grid>

                <Grid xs={12}>
                    <Controller
                        name="rfc"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <TextField
                                fullWidth
                                label="RFC"
                                {...field}
                                error={!!error}
                                helperText={error ? error.message : null}
                                slotProps={{ htmlInput: { maxLength: 13 } }}
                            />
                        )}
                    />
                </Grid>

                <Grid xs={12}>
                    <Controller
                        name="nss"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <TextField
                                fullWidth
                                label="NSS"
                                {...field}
                                error={!!error}
                                helperText={error ? error.message : null}
                                slotProps={{ htmlInput: { maxLength: 11 } }}
                            />
                        )}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default IdentificationForm;