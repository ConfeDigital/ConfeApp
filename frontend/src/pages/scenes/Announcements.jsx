import React, { useEffect, useState, useRef } from 'react';
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
import AttachFileIcon from '@mui/icons-material/AttachFile';
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
    const [imageErrors, setImageErrors] = useState({});
    
    // Add a ref for the hidden file input
    const fileInputRef = useRef(null);

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
    
    // Handle file selection
    const handleFileSelect = (files) => {
        // Since your backend expects a single attachment, we take the first one
        if (files.length > 0) {
            setAttachment(files[0]);
        }
    };
    
    const isImageUrl = (url) => {
        if (!url) return false;
        
        const extensionMatch = url.match(/\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i);
        if (extensionMatch) return true;
        
        const pathMatch = url.match(/\.(jpeg|jpg|png|gif|webp|bmp|svg)/i);
        if (pathMatch) return true;
        
        return false;
    };

    const handleImageError = (postId) => {
        setImageErrors(prev => ({ ...prev, [postId]: true }));
    };

    const getFileType = (url) => {
        if (!url) return 'unknown';
        
        if (url.match(/\.(jpeg|jpg|png|gif|webp|bmp|svg)/i)) return 'image';
        if (url.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)/i)) return 'video';
        if (url.match(/\.(pdf)/i)) return 'pdf';
        if (url.match(/\.(doc|docx|txt|rtf)/i)) return 'document';
        
        return 'unknown';
    };

    const renderAttachment = (post) => {
        if (!post.attachment) return null;

        const fileType = getFileType(post.attachment);
        const hasImageError = imageErrors[post.id];

        if (fileType === 'image' && !hasImageError) {
            return (
                <Box mt={2}>
                    <Box
                        component="img"
                        src={post.attachment}
                        alt="Adjunto"
                        sx={{ 
                            maxWidth: '100%', 
                            maxHeight: 300, 
                            borderRadius: 2,
                            display: 'block'
                        }}
                        onError={() => handleImageError(post.id)}
                        onLoad={() => {
                            setImageErrors(prev => {
                                const newState = { ...prev };
                                delete newState[post.id];
                                return newState;
                            });
                        }}
                    />
                </Box>
            );
        }

        if (fileType === 'video') {
            return (
                <Box mt={2}>
                    <video
                        controls
                        style={{
                            width: '100%',
                            maxHeight: '400px',
                            borderRadius: '8px'
                        }}
                    >
                        <source src={post.attachment} />
                        Tu navegador no soporta este formato de video.
                    </video>
                </Box>
            );
        }

        if (fileType === 'pdf') {
            return (
                <Box mt={2}>
                    <iframe
                        src={`${post.attachment}#toolbar=1`}
                        width="100%"
                        height="400px"
                        style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px'
                        }}
                        title="PDF Attachment"
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                        Si el PDF no se muestra correctamente, 
                        <Button 
                            size="small" 
                            href={post.attachment} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ ml: 1 }}
                        >
                            haz clic aquí para verlo
                        </Button>
                    </Typography>
                </Box>
            );
        }

        return (
            <Box mt={2}>
                <Button
                    variant="outlined"
                    href={post.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                >
                    Ver archivo adjunto
                </Button>
            </Box>
        );
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
                        
                        {renderAttachment(post)}
                        
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

                        {/* Integrated file attachment button */}
                        <Box mt={2}>
                            <Button
                                startIcon={<AttachFileIcon />}
                                onClick={() => fileInputRef.current?.click()}
                                variant="outlined"
                            >
                                {attachment ? attachment.name : 'Adjuntar Archivo'}
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileSelect(e.target.files)}
                                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                            />
                        </Box>

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