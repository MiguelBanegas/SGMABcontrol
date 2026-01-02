import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Settings as SettingsIcon, Save, ArrowLeft } from 'lucide-react';
import { getServerUrl, setServerUrl } from '../utils/config';
import { Link, useNavigate } from 'react-router-dom';

const Settings = () => {
    const [url, setUrl] = useState(getServerUrl());
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSave = () => {
        setServerUrl(url);
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            navigate('/');
        }, 1500);
    };

    return (
        <Container className="mt-4">
            <div className="d-flex align-items-center mb-4">
                <Button variant="link" onClick={() => navigate('/')} className="p-0 me-3 text-dark">
                    <ArrowLeft size={24} />
                </Button>
                <h2 className="mb-0 d-flex align-items-center">
                    <SettingsIcon className="me-2" /> Configuración
                </h2>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>URL del Servidor</Form.Label>
                        <Form.Control 
                            type="url" 
                            placeholder="http://..." 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <Form.Text className="text-muted">
                            Por defecto: http://sgm.mabcontrol.ar. Útil para pruebas locales (ej: http://192.168.1.10:5000)
                        </Form.Text>
                    </Form.Group>

                    {showSuccess && (
                        <Alert variant="success" className="py-2">
                            Configuración guardada. Reinicie la app para aplicar.
                        </Alert>
                    )}

                    <Button variant="primary" onClick={handleSave} className="w-100 d-flex align-items-center justify-content-center">
                        <Save size={18} className="me-2" /> Guardar Cambios
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Settings;
