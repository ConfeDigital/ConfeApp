import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Input,
  Snackbar,
  Alert,
} from '@mui/material';
import { useSelector } from 'react-redux';
import axios from '../../api';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import useDocumentTitle from '../../components/hooks/useDocumentTitle';
import { useLocation } from 'react-router-dom';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  title: yup.string().required('El título es obligatorio'),
  message: yup.string().required('El mensaje es obligatorio'),
});

const Announcements = () => {
  useDocumentTitle('Anuncios');
  const isAdmin = useSelector((state) => state.auth.user?.is_staff);

  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [alert, setAlert] = useState({ open: false, severity: 'success', message: '' });

  const location = useLocation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    fetchPosts();
  }, [location.search]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get('/api/communications/comunicados/');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('message', data.message);
    if (attachment) formData.append('attachment', attachment);

    try {
      await axios.post('/api/communications/comunicados/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAlert({ open: true, severity: 'success', message: 'Comunicado publicado exitosamente' });
      setOpen(false);
      reset();
      setAttachment(null);
      fetchPosts();
    } catch (error) {
      setAlert({
        open: true,
        severity: 'error',
        message: 'Ocurrió un error al publicar el comunicado',
      });
    }
  };

  return (
    <Box p={2}>
      {isAdmin && (
        <Button variant="contained" onClick={() => setOpen(true)}>
          Nuevo Mensaje
        </Button>
      )}

      {posts.map((post) => (
        <Card key={post.id} sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h4" sx={{ color: 'primary.main' }}>
              {post.title}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mt: 1 }}>
              {post.message}
            </Typography>
            {post.attachment && (
              <Box mt={2}>
                {post.attachment.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                  <Box
                    component="img"
                    src={post.attachment}
                    alt="Adjunto"
                    sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 2 }}
                  />
                ) : (
                  <a href={post.attachment} target="_blank" rel="noopener noreferrer">
                    Ver archivo adjunto
                  </a>
                )}
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" mt={2}>
              Publicado por: {post.created_by.first_name} {post.created_by.last_name} (
              {post.created_by.email}) - {dayjs(post.created_at).format('LLL')}
            </Typography>
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo Comunicado</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              label="Título"
              fullWidth
              sx={{ mb: 2, mt: 2 }}
              {...register('title')}
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
            />
            <TextField
              label="Mensaje"
              fullWidth
              multiline
              rows={5}
              sx={{ mb: 2 }}
              {...register('message')}
              error={Boolean(errors.message)}
              helperText={errors.message?.message}
            />
            <Input
              type="file"
              onChange={(e) => setAttachment(e.target.files[0])}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Publicando...' : 'Publicar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Announcements;
