import React, { useEffect, useState, useRef } from 'react';
import {
    Box, Typography, TextField, Button, Paper, Card, CardContent, 
    Avatar, Chip, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, Divider, Menu, MenuItem, List, ListItem,
    ListItemIcon, ListItemText, Badge, Fab, Grid, Tooltip,
    Alert, LinearProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Reply as ReplyIcon,
    Visibility as ViewIcon,
    Message as MessageIcon,
    PushPin as PinIcon,
    Lock as LockIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    AttachFile as AttachFileIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    VideoFile as VideoIcon,
    Description as DocumentIcon,
    Download as DownloadIcon,
    AccessTime as TimeIcon,
    Person as PersonIcon,
    Close as CloseIcon,
    Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from '../../api';
import useDocumentTitle from '../../components/hooks/useDocumentTitle';

function stringToColor(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    const saturation = 40;
    const lightness = 65;
    
    const hslToRgb = (h, s, l) => {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };
    
    const [r, g, b] = hslToRgb(hue, saturation, lightness);
    const toHex = (c) => `00${c.toString(16)}`.slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const FileIcon = ({ fileType, size = 'small' }) => {
    const iconProps = { fontSize: size };
    switch (fileType) {
        case 'image':
            return <ImageIcon {...iconProps} color="primary" />;
        case 'pdf':
            return <PdfIcon {...iconProps} color="error" />;
        case 'video':
            return <VideoIcon {...iconProps} color="secondary" />;
        case 'document':
            return <DocumentIcon {...iconProps} color="info" />;
        default:
            return <AttachFileIcon {...iconProps} />;
    }
};

const ImageLightbox = ({ open, onClose, imageUrl, imageName }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    boxShadow: 'none',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogContent sx={{ p: 0, position: 'relative' }}>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'white',
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                        zIndex: 1
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="50vh"
                    onClick={onClose}
                    sx={{ cursor: 'pointer' }}
                >
                    <img
                        src={imageUrl}
                        alt={imageName}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '80vh',
                            objectFit: 'contain'
                        }}
                    />
                </Box>
                {imageName && (
                    <Typography
                        variant="caption"
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            color: 'white',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                        }}
                    >
                        {imageName}
                    </Typography>
                )}
            </DialogContent>
        </Dialog>
    );
};

const FilePreview = ({ file, expanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(expanded);
    const [imageError, setImageError] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);

    const handleDownload = () => {
        window.open(file.file_url, '_blank');
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderFileContent = () => {
        if (!isExpanded) return null;

        switch (file.file_type) {
            case 'image':
                return (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        {!imageError ? (
                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={file.file_url}
                                    alt={file.original_name}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '400px',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        cursor: 'pointer'
                                    }}
                                    onError={() => setImageError(true)}
                                    onClick={() => setShowLightbox(true)}
                                />
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                                    }}
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowLightbox(true);
                                    }}
                                >
                                    <FullscreenIcon fontSize="small" />
                                </IconButton>
                                <ImageLightbox
                                    open={showLightbox}
                                    onClose={() => setShowLightbox(false)}
                                    imageUrl={file.file_url}
                                    imageName={file.original_name}
                                />
                            </Box>
                        ) : (
                            <Alert severity="error" sx={{ mt: 1 }}>
                                Error loading image. <Button onClick={handleDownload}>Download instead</Button>
                            </Alert>
                        )}
                    </Box>
                );

            case 'video':
                return (
                    <Box sx={{ mt: 2 }}>
                        <video
                            controls
                            style={{
                                width: '100%',
                                maxHeight: '400px',
                                borderRadius: '8px'
                            }}
                        >
                            <source src={file.file_url} />
                            Your browser does not support the video tag.
                            <Button onClick={handleDownload}>Download video</Button>
                        </video>
                    </Box>
                );

            case 'pdf':
                return (
                    <Box sx={{ mt: 2 }}>
                        <iframe
                            src={`${file.file_url}#toolbar=1`}
                            width="100%"
                            height="400px"
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: '8px'
                            }}
                            title={file.original_name}
                        />
                        <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                            If PDF doesn't display properly, <Button size="small" onClick={handleDownload}>click here to download</Button>
                        </Typography>
                    </Box>
                );

            default:
                return (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Preview not available for this file type. 
                        <Button onClick={handleDownload} sx={{ ml: 1 }}>Download to view</Button>
                    </Alert>
                );
        }
    };

    const canPreview = ['image', 'video', 'pdf'].includes(file.file_type);

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                transition: 'all 0.2s ease',
                '&:hover': { 
                    bgcolor: 'action.hover',
                    boxShadow: 2
                }
            }}
        >
            <Box display="flex" alignItems="center" gap={1}>
                <FileIcon fileType={file.file_type} size="medium" />
                <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                        {file.original_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.file_size)} • {file.file_type.toUpperCase()}
                    </Typography>
                </Box>
                
                <Box display="flex" gap={0.5}>
                    {canPreview && (
                        <Tooltip title={isExpanded ? "Hide preview" : "Show preview"}>
                            <IconButton 
                                size="small"
                                onClick={() => setIsExpanded(!isExpanded)}
                                color={isExpanded ? "primary" : "default"}
                            >
                                <ViewIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Download">
                        <IconButton size="small" onClick={handleDownload}>
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {renderFileContent()}
        </Paper>
    );
};

const FileGallery = ({ files, maxPreview = 2 }) => {
    const [showAll, setShowAll] = useState(false);
    
    if (!files || files.length === 0) return null;

    const displayFiles = showAll ? files : files.slice(0, maxPreview);
    const remainingCount = files.length - maxPreview;

    return (
        <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFileIcon fontSize="small" />
                Archivos adjuntos ({files.length})
            </Typography>
            
            <Grid container spacing={2}>
                {displayFiles.map((file) => (
                    <Grid item xs={12} key={file.id}>
                        <FilePreview file={file} />
                    </Grid>
                ))}
            </Grid>

            {!showAll && remainingCount > 0 && (
                <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowAll(true)}
                    sx={{ mt: 1 }}
                >
                    Ver {remainingCount} archivo{remainingCount > 1 ? 's' : ''} más
                </Button>
            )}

            {showAll && files.length > maxPreview && (
                <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowAll(false)}
                    sx={{ mt: 1 }}
                >
                    Mostrar menos
                </Button>
            )}
        </Box>
    );
};

const TopicCard = ({ topic, onClick }) => {
    const centerColor = stringToColor(topic.author_center);
    const timeAgo = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffInHours = (now - past) / (1000 * 60 * 60);
        
        if (diffInHours < 1) return 'Hace menos de 1h';
        if (diffInHours < 24) return `Hace ${Math.floor(diffInHours)}h`;
        if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)}d`;
        return past.toLocaleDateString();
    };

    return (
        <Card 
            sx={{ 
                mb: 1, 
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { 
                    elevation: 3,
                    transform: 'translateY(-1px)'
                }
            }}
            onClick={onClick}
        >
            <CardContent sx={{ pb: '16px !important' }}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                    <Avatar
                        sx={{
                            bgcolor: centerColor,
                            width: 40,
                            height: 40,
                            fontSize: '0.875rem'
                        }}
                    >
                        {topic.author_center.charAt(0)}
                    </Avatar>
                    
                    <Box flex={1} minWidth={0}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            {topic.is_pinned && (
                                <Tooltip title="Fijado">
                                    <PinIcon color="primary" fontSize="small" />
                                </Tooltip>
                            )}
                            {topic.is_locked && (
                                <Tooltip title="Cerrado">
                                    <LockIcon color="disabled" fontSize="small" />
                                </Tooltip>
                            )}
                            <Typography 
                                variant="h6" 
                                component="h3"
                                sx={{ 
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    lineHeight: 1.3
                                }}
                                noWrap
                            >
                                {topic.title}
                            </Typography>
                        </Box>
                        
                        <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 1
                            }}
                        >
                            {topic.description}
                        </Typography>

                        {topic.files && topic.files.length > 0 && (
                            <Box mb={1}>
                                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <AttachFileIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                        {topic.files.length} archivo{topic.files.length > 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                    {topic.files.slice(0, 3).map((file, index) => (
                                        <Chip
                                            key={index}
                                            icon={<FileIcon fileType={file.file_type} />}
                                            label={file.original_name.length > 15 
                                                ? file.original_name.substring(0, 15) + '...' 
                                                : file.original_name}
                                            size="small"
                                            variant="outlined"
                                            sx={{ maxWidth: 150 }}
                                        />
                                    ))}
                                    {topic.files.length > 3 && (
                                        <Chip
                                            label={`+${topic.files.length - 3}`}
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                        />
                                    )}
                                </Box>
                            </Box>
                        )}
                        
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={2}>
                                <Chip
                                    label={topic.author_center}
                                    size="small"
                                    sx={{ 
                                        bgcolor: centerColor + '20',
                                        color: centerColor,
                                        fontWeight: 500
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    por {topic.author_name}
                                </Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <ViewIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                        {topic.views}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    <MessageIcon fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                        {topic.reply_count}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {timeAgo(topic.last_reply_at)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

const ReplyCard = ({ reply, canEdit, onEdit, onDelete }) => {
    const [menuAnchor, setMenuAnchor] = useState(null);
    const centerColor = stringToColor(reply.author_center);
    
    const timeAgo = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffInHours = (now - past) / (1000 * 60 * 60);
        
        if (diffInHours < 1) return 'Hace menos de 1h';
        if (diffInHours < 24) return `Hace ${Math.floor(diffInHours)}h`;
        if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)}d`;
        return past.toLocaleDateString();
    };

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Box display="flex" alignItems="flex-start" gap={2}>
                    <Avatar
                        sx={{
                            bgcolor: centerColor,
                            width: 36,
                            height: 36
                        }}
                    >
                        {reply.author_center.charAt(0)}
                    </Avatar>
                    
                    <Box flex={1}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    {reply.author_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {reply.author_center} • {timeAgo(reply.created_at)}
                                    {reply.is_edited && ' • editado'}
                                </Typography>
                            </Box>
                            
                            {canEdit && (
                                <IconButton
                                    size="small"
                                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                                >
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                        
                        <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                            {reply.content}
                        </Typography>
                        
                        {reply.files && reply.files.length > 0 && (
                            <FileGallery files={reply.files} maxPreview={1} />
                        )}
                    </Box>
                </Box>
            </CardContent>
            
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
            >
                <MenuItem onClick={() => { onEdit(reply); setMenuAnchor(null); }}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Editar</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { onDelete(reply); setMenuAnchor(null); }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Eliminar</ListItemText>
                </MenuItem>
            </Menu>
        </Card>
    );
};

const CenterForum = () => {
    useDocumentTitle('Foro de Centros');

    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [showNewTopic, setShowNewTopic] = useState(false);
    const [showReplyDialog, setShowReplyDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Form states
    const [newTopicForm, setNewTopicForm] = useState({ title: '', description: '', files: [] });
    const [replyForm, setReplyForm] = useState({ content: '', files: [] });
    const [editingReply, setEditingReply] = useState(null);
    
    const user = useSelector((state) => state.auth.user);
    const fileInputRef = useRef();
    const replyFileInputRef = useRef();

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            setLoading(true);
            const res = await axios.get('api/communications/forum/topics/');
            setTopics(res.data);
        } catch (error) {
            console.error('Error fetching topics:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTopicDetail = async (topicId) => {
        try {
            setLoading(true);
            const res = await axios.get(`api/communications/forum/topics/${topicId}/`);
            setSelectedTopic(res.data);
        } catch (error) {
            console.error('Error fetching topic detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTopic = async () => {
        if (!newTopicForm.title.trim() || !newTopicForm.description.trim()) {
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('title', newTopicForm.title);
            formData.append('description', newTopicForm.description);
            
            newTopicForm.files.forEach((file) => {
                formData.append('files', file);
            });

            await axios.post('api/communications/forum/topics/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setNewTopicForm({ title: '', description: '', files: [] });
            setShowNewTopic(false);
            fetchTopics();
        } catch (error) {
            console.error('Error creating topic:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleReply = async () => {
        if (!replyForm.content.trim()) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('content', replyForm.content);
            
            replyForm.files.forEach((file) => {
                formData.append('files', file);
            });

            if (editingReply) {
                await axios.patch(`api/communications/forum/replies/${editingReply.id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setEditingReply(null);
            } else {
                await axios.post(`api/communications/forum/topics/${selectedTopic.id}/reply/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setReplyForm({ content: '', files: [] });
            setShowReplyDialog(false);
            fetchTopicDetail(selectedTopic.id);
        } catch (error) {
            console.error('Error posting reply:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (files, isReply = false) => {
        const fileArray = Array.from(files);
        if (isReply) {
            setReplyForm(prev => ({ ...prev, files: [...prev.files, ...fileArray] }));
        } else {
            setNewTopicForm(prev => ({ ...prev, files: [...prev.files, ...fileArray] }));
        }
    };

    const removeFile = (index, isReply = false) => {
        if (isReply) {
            setReplyForm(prev => ({
                ...prev,
                files: prev.files.filter((_, i) => i !== index)
            }));
        } else {
            setNewTopicForm(prev => ({
                ...prev,
                files: prev.files.filter((_, i) => i !== index)
            }));
        }
    };

    const handleEditReply = (reply) => {
        setEditingReply(reply);
        setReplyForm({ content: reply.content, files: [] });
        setShowReplyDialog(true);
    };

    const handleDeleteReply = async (reply) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta respuesta?')) return;
        
        try {
            await axios.delete(`api/communications/forum/replies/${reply.id}/`);
            fetchTopicDetail(selectedTopic.id);
        } catch (error) {
            console.error('Error deleting reply:', error);
        }
    };

    // Topic List View
    if (!selectedTopic) {
        return (
            <Box p={2}>
                {/* <Box display="flex" justifyContent="right" alignItems="center" mb={3}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowNewTopic(true)}
                        size="large"
                    >
                        Nuevo Tema
                    </Button>
                </Box> */}

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                <Box>
                    {topics.map((topic) => (
                        <TopicCard
                            key={topic.id}
                            topic={topic}
                            onClick={() => fetchTopicDetail(topic.id)}
                        />
                    ))}
                </Box>

                {/* New Topic Dialog */}
                <Dialog
                    open={showNewTopic}
                    onClose={() => setShowNewTopic(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>Crear Nuevo Tema</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Título"
                            value={newTopicForm.title}
                            onChange={(e) => setNewTopicForm(prev => ({ 
                                ...prev, title: e.target.value 
                            }))}
                            margin="normal"
                            variant="outlined"
                        />
                        <TextField
                            fullWidth
                            label="Descripción"
                            multiline
                            rows={4}
                            value={newTopicForm.description}
                            onChange={(e) => setNewTopicForm(prev => ({ 
                                ...prev, description: e.target.value 
                            }))}
                            margin="normal"
                            variant="outlined"
                        />
                        
                        <Box mt={2}>
                            <Button
                                startIcon={<AttachFileIcon />}
                                onClick={() => fileInputRef.current?.click()}
                                variant="outlined"
                            >
                                Adjuntar Archivos
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileSelect(e.target.files)}
                                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                            />
                        </Box>

                        {newTopicForm.files.length > 0 && (
                            <Box mt={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Archivos adjuntos:
                                </Typography>
                                {newTopicForm.files.map((file, index) => (
                                    <Chip
                                        key={index}
                                        label={file.name}
                                        onDelete={() => removeFile(index)}
                                        sx={{ m: 0.5 }}
                                        icon={<AttachFileIcon />}
                                    />
                                ))}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowNewTopic(false)} color='secondary'>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateTopic}
                            variant="contained"
                            disabled={uploading || !newTopicForm.title.trim() || !newTopicForm.description.trim()}
                        >
                            {uploading ? 'Creando...' : 'Crear Tema'}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Fab
                    color="primary"
                    aria-label="add"
                    sx={{ position: 'fixed', bottom: 16, right: 16 }}
                    onClick={() => setShowNewTopic(true)}
                >
                    <AddIcon />
                </Fab>
            </Box>
        );
    }

    // Topic Detail View
    const centerColor = stringToColor(selectedTopic.author_center);
    const timeAgo = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffInHours = (now - past) / (1000 * 60 * 60);
        
        if (diffInHours < 1) return 'Hace menos de 1h';
        if (diffInHours < 24) return `Hace ${Math.floor(diffInHours)}h`;
        if (diffInHours < 168) return `Hace ${Math.floor(diffInHours / 24)}d`;
        return past.toLocaleDateString();
    };

    return (
        <Box p={2}>
            {/* Header */}
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Button
                    variant="outlined"
                    onClick={() => setSelectedTopic(null)}
                >
                    ← Volver al Foro
                </Button>
                <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        {selectedTopic.is_pinned && (
                            <PinIcon color="primary" fontSize="small" />
                        )}
                        {selectedTopic.is_locked && (
                            <LockIcon color="disabled" fontSize="small" />
                        )}
                        <Typography variant="h5" fontWeight="bold">
                            {selectedTopic.title}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Chip
                            label={selectedTopic.author_center}
                            size="small"
                            sx={{ 
                                bgcolor: centerColor + '20',
                                color: centerColor,
                                fontWeight: 500
                            }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            por {selectedTopic.author_name} • {timeAgo(selectedTopic.created_at)}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <ViewIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                                {selectedTopic.views} vistas
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                {!selectedTopic.is_locked && (
                    <Button
                        variant="contained"
                        startIcon={<ReplyIcon />}
                        onClick={() => setShowReplyDialog(true)}
                    >
                        Responder
                    </Button>
                )}
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Topic Content */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedTopic.description}
                    </Typography>
                    
                    {selectedTopic.files && selectedTopic.files.length > 0 && (
                        <FileGallery files={selectedTopic.files} maxPreview={3} />
                    )}
                </CardContent>
            </Card>

            <Divider sx={{ mb: 2 }} />

            {/* Replies */}
            <Typography variant="h6" gutterBottom>
                Respuestas ({selectedTopic.reply_count})
            </Typography>

            <Box>
                {selectedTopic.replies?.map((reply) => (
                    <ReplyCard
                        key={reply.id}
                        reply={reply}
                        canEdit={reply.can_edit}
                        onEdit={handleEditReply}
                        onDelete={handleDeleteReply}
                    />
                ))}
            </Box>

            {/* Reply Dialog */}
            <Dialog
                open={showReplyDialog}
                onClose={() => {
                    setShowReplyDialog(false);
                    setEditingReply(null);
                    setReplyForm({ content: '', files: [] });
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {editingReply ? 'Editar Respuesta' : 'Nueva Respuesta'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Contenido"
                        multiline
                        rows={4}
                        value={replyForm.content}
                        onChange={(e) => setReplyForm(prev => ({ 
                            ...prev, content: e.target.value 
                        }))}
                        margin="normal"
                        variant="outlined"
                    />
                    
                    <Box mt={2}>
                        <Button
                            startIcon={<AttachFileIcon />}
                            onClick={() => replyFileInputRef.current?.click()}
                            variant="outlined"
                        >
                            Adjuntar Archivos
                        </Button>
                        <input
                            ref={replyFileInputRef}
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileSelect(e.target.files, true)}
                            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                        />
                    </Box>

                    {replyForm.files.length > 0 && (
                        <Box mt={2}>
                            <Typography variant="subtitle2" gutterBottom>
                                Archivos adjuntos:
                            </Typography>
                            {replyForm.files.map((file, index) => (
                                <Chip
                                    key={index}
                                    label={file.name}
                                    onDelete={() => removeFile(index, true)}
                                    sx={{ m: 0.5 }}
                                    icon={<AttachFileIcon />}
                                />
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button color='secondary' onClick={() => {
                        setShowReplyDialog(false);
                        setEditingReply(null);
                        setReplyForm({ content: '', files: [] });
                    }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleReply}
                        variant="contained"
                        disabled={uploading || !replyForm.content.trim()}
                    >
                        {uploading ? 'Enviando...' : (editingReply ? 'Actualizar' : 'Responder')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Fixed Reply Button */}
            {!selectedTopic.is_locked && (
                <Fab
                    color="primary"
                    aria-label="reply"
                    sx={{ position: 'fixed', bottom: 16, right: 16 }}
                    onClick={() => setShowReplyDialog(true)}
                >
                    <ReplyIcon />
                </Fab>
            )}
        </Box>
    );
};

export default CenterForum;