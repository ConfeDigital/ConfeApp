import React, { useEffect, useState, useRef } from 'react';
import {
    Box, Typography, TextField, Button, Paper
} from '@mui/material';
import { useSelector } from 'react-redux';
import axios from '../../api';

import useDocumentTitle from '../../components/hooks/useDocumentTitle';

// const colorPalette = ['#dce775', '#4fc3f7', '#ffb74d', '#ba68c8', '#aed581'];

function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function stringToColor(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use a modulo 360 to get a hue value between 0 and 359
    const hue = hash % 360;

    // Define desired saturation and lightness for less saturated colors
    // Saturation (0-100): Lower values mean less vibrant, more greyish.
    // Lightness (0-100): Moderate values (e.g., 50-70) prevent too dark or too bright.
    const saturation = 40; // Example: 40% saturation (you can adjust this)
    const lightness = 65;  // Example: 65% lightness (you can adjust this)

    const [r, g, b] = hslToRgb(hue, saturation, lightness);

    // Convert RGB to hex string
    const toHex = (c) => `00${c.toString(16)}`.slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const CenterChat = () => {
    useDocumentTitle('Comunicación de Centros');

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const user = useSelector((state) => state.auth.user);
    const containerRef = useRef();

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        const res = await axios.get('api/communications/center-chat/');
        setMessages(res.data);
    };

    const sendMessage = async () => {
        if (!text.trim()) return;
        await axios.post('api/communications/center-chat/', { text });
        setText('');
        fetchMessages();
    };

    useEffect(() => {
        containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    // const getColorForCenter = (centerName) => {
    //     const index = [...new Set(messages.map(m => m.center))].indexOf(centerName);
    //     return colorPalette[index % colorPalette.length];
    // };

    return (
        <Box p={2}>
            <Paper variant="outlined" sx={{ height: "75vh", overflowY: 'auto', p: 2, mb: 2 }} ref={containerRef}>
                {messages.map((msg) => {
                    // const isOwn = msg.sender_name === `${user.first_name} ${user.last_name}`;
                    const isOwn = msg.sender_id === user.id;
                    return (
                        <Box
                            key={msg.id}
                            display="flex"
                            justifyContent={isOwn ? 'flex-end' : 'flex-start'}
                            mb={1}
                        >
                            <Box
                                sx={{
                                    // backgroundColor: getColorForCenter(msg.center),
                                    // backgroundColor: stringToColor(msg.center),
                                    backgroundColor: "background.default",
                                    p: 1.5,
                                    borderRadius: 2,
                                    maxWidth: '70%',
                                }}
                            >
                                <Typography sx={{ color: stringToColor(msg.center) }} variant="body2" fontWeight="bold">{msg.sender_name} ({msg.center})</Typography>
                                <Typography variant="body1">{msg.text}</Typography>
                                <Typography variant="caption" display="block" align="right">
                                    {new Date(msg.sent_at).toLocaleTimeString()}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Paper>

            <Box display="flex" gap={1}>
                <TextField
                    fullWidth
                    placeholder="Escribe un mensaje"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button variant="contained" onClick={sendMessage}>Enviar</Button>
            </Box>
        </Box>
    );
};

export default CenterChat;
